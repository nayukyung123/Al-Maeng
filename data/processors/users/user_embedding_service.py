import numpy as np
import psycopg2
from datetime import datetime

class UserEmbeddingService:
    def __init__(self, db_config):
        self.conn = psycopg2.connect(**db_config)
        self.cur = self.conn.cursor()
        
        # 주연님의 시뮬레이션 가중치 설정 (W_s, W_a)
        self.source_weights = {'search': 1.5, 'curation': 0.4, 'trend': 0.7}
        self.action_weights = {'view': 0.3, 'wish': 1.2, 'complete': 1.5, 'cancel_complete': 0.0}

    def _parse_vector(self, raw_val):
        """pgvector 문자열 또는 리스트를 numpy float 배열로 변환"""
        if raw_val is None:
            return np.zeros(1536)
        if isinstance(raw_val, str):
            clean_val = raw_val.strip('[]').split(',')
            return np.array(clean_val, dtype=float)
        return np.array(raw_val, dtype=float)

    def get_genre_vector(self, user_id):
        """Case 1: 선호 장르 기반 평균 벡터 계산"""
        query = """
            SELECT b.embedding_vector
            FROM users_genres ug
            JOIN book_genres bg ON ug.genre_id = bg.genre_id
            JOIN books b ON bg.book_id = b.id
            WHERE ug.user_id = %s
        """
        self.cur.execute(query, (user_id,))
        embeddings = self.cur.fetchall()
        
        if not embeddings:
            return np.zeros(1536)
        
        vec_list = [self._parse_vector(e[0]) for e in embeddings]
        avg_vec = np.mean(vec_list, axis=0)
        
        norm = np.linalg.norm(avg_vec)
        return avg_vec / norm if norm > 0 else avg_vec

    def get_action_vector(self, user_id):
        """Case 2, 3, 4: 활동 로그 기반 가중치 및 지수 감쇠 적용"""
        # Case 4: 완독 취소된 도서 ID 목록 확보 (제외용)
        self.cur.execute("SELECT book_id FROM click_log WHERE user_id = %s AND action = 'cancel_complete'", (user_id,))
        cancelled_books = {r[0] for r in self.cur.fetchall()}

        query = """
            SELECT l.book_id, l.source, l.action, l.created_at, b.embedding_vector
            FROM click_log l
            JOIN books b ON l.book_id = b.id
            WHERE l.user_id = %s AND l.action != 'cancel_complete'
        """
        self.cur.execute(query, (user_id,))
        logs = self.cur.fetchall()
        
        if not logs:
            return np.zeros(1536)

        total_vec = np.zeros(1536)
        now = datetime.now()

        for bid, src, act, dt, emb in logs:
            if bid in cancelled_books: continue # 완독 취소 건 제외
            
            # 지수 감쇠 계산 (7일 주기)
            days_diff = (now - dt).days
            decay = 0.5 ** (max(0, days_diff) / 7)
            
            # (유입 가중치 * 행동 가중치) * 시간 감쇠
            score = (self.source_weights.get(src, 1.0) * self.action_weights.get(act, 1.0)) * decay
            total_vec += self._parse_vector(emb) * score

        norm = np.linalg.norm(total_vec)
        return total_vec / norm if norm > 0 else total_vec

    def get_final_user_vector(self, user_id, n_logs):
        """최종 비중 적용 (N에 따른 단계별 로직)"""
        v_genre = self.get_genre_vector(user_id)
        v_action = self.get_action_vector(user_id)
        
        # 주연님의 시뮬레이션 비중 적용
        if n_logs == 0:    w_g, w_a = 0.5, 0.0 # Case 1
        elif n_logs <= 3:  w_g, w_a = 0.5, 0.2 # Case 2
        else:              w_g, w_a = 0.3, 0.7 # Case 3, 4
            
        final_v = (v_genre * w_g) + (v_action * w_a)
        norm = np.linalg.norm(final_v)
        return final_v / norm if norm > 0 else final_v

    def close(self):
        self.cur.close()
        self.conn.close()

if __name__ == "__main__":
    conf = { "host": "localhost", "port": 5433, "user": "almaeng", "password": "almaeng", "database": "almaeng" }
    service = UserEmbeddingService(conf)
    
    try:
        user_id = 1
        final_v = service.get_final_user_vector(user_id, n_logs=0) # N=0 (Cold Start)
        final_v_list = final_v.tolist()

        # 기존 데이터 삭제
        service.cur.execute("DELETE FROM user_recommendation_pool WHERE user_id = %s", (user_id,))

        # 1. 벡터 유사도 기반 추천 (2권)
        vector_query = """
            INSERT INTO user_recommendation_pool (user_id, book_id, score, reason_type)
            SELECT %s, id, (1 - (embedding_vector <=> %s::vector)), 'VECTOR'
            FROM books
            ORDER BY embedding_vector <=> %s::vector
            LIMIT 2;
        """
        service.cur.execute(vector_query, (user_id, final_v_list, final_v_list))

        # 2. 무작위 추천 (2권)
        random_query = """
            INSERT INTO user_recommendation_pool (user_id, book_id, score, reason_type)
            SELECT %s, id, 0.0, 'RANDOM'
            FROM books
            WHERE id NOT IN (SELECT book_id FROM user_recommendation_pool WHERE user_id = %s)
            ORDER BY RANDOM()
            LIMIT 2;
        """
        service.cur.execute(random_query, (user_id, user_id))
        
        service.conn.commit()
        print("\n✅ [Case 1] 장르 기반(VECTOR) + 무작위(RANDOM) 믹스 완료!")

        # 3. 결과 확인 (DB에서 방금 넣은 데이터 다시 읽어오기)
        service.cur.execute("""
            SELECT book_id, score, reason_type 
            FROM user_recommendation_pool 
            WHERE user_id = %s 
            ORDER BY reason_type DESC, score DESC
        """, (user_id,))
        results = service.cur.fetchall() # 여기서 results를 정의해줍니다!

        for bid, score, reason in results:
            print(f"[{reason}] 도서 ID: {bid} | 점수: {score:.4f}")

    except Exception as e:
        print(f"❌ 오류 발생: {e}")
        service.conn.rollback()
    finally:
        service.close()