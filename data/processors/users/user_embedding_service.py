import os
import numpy as np
import psycopg2
import schedule
import time
import threading
import logging
from datetime import datetime
from psycopg2 import pool
from dotenv import load_dotenv

# 1. 환경 변수 및 로깅 설정
load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s',
    handlers=[
        logging.FileHandler("recommendation_engine.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class UserEmbeddingService:
    def __init__(self, db_config):
        self.db_config = db_config
        self.dim = 1024
        self.db_pool = psycopg2.pool.SimpleConnectionPool(1, 10, **db_config)
        
        self.source_weights = {'search': 1.5, 'content': 1.2, 'curation': 1.1, 'book': 1.0, 'ranking': 0.8, 'trend': 0.7, 'none': 0.6}
        self.action_weights = {'view': 0.3, 'wish': 1.2, 'complete': 1.5, 'wish_cancel': 0.0, 'complete_cancel': 0.0, 'cancel_complete': 0.0}

    def _get_conn(self):
        return self.db_pool.getconn()

    def _put_conn(self, conn):
        self.db_pool.putconn(conn)

    def _parse_vector(self, raw_val):
        if raw_val is None: return np.zeros(self.dim)
        if isinstance(raw_val, str):
            return np.array(raw_val.strip('[]').split(','), dtype=float)
        return np.array(raw_val, dtype=float)

    def get_genre_vector(self, user_id, cur):
        query = """
            WITH RECURSIVE genre_tree AS (
                SELECT id FROM genres WHERE id IN (SELECT genre_id FROM users_genres WHERE user_id = %s)
                UNION ALL
                SELECT g.id FROM genres g JOIN genre_tree gt ON g.parent_id = gt.id
            )
            SELECT b.embedding_vector FROM genre_tree gt
            JOIN book_genres bg ON gt.id = bg.genre_id
            JOIN books b ON bg.book_id = b.id
        """
        cur.execute(query, (user_id,))
        embeddings = cur.fetchall()
        if not embeddings: return np.zeros(self.dim)
        vec_list = [self._parse_vector(e[0]) for e in embeddings]
        avg_vec = np.mean(vec_list, axis=0)
        norm = np.linalg.norm(avg_vec)
        return avg_vec / norm if norm > 0 else avg_vec

    def get_action_vector(self, user_id, cur):
        query = """
            SELECT b.id, b.embedding_vector, l.source, l.action, l.created_at
            FROM click_log l JOIN books b ON l.book_id = b.id
            WHERE l.user_id = %s
            ORDER BY l.book_id, l.created_at DESC
        """
        cur.execute(query, (user_id,))
        logs = cur.fetchall()
        if not logs: return np.zeros(self.dim)
        
        book_scores = {}
        book_vectors = {}
        now = datetime.now()

        for b_id, emb, src, act, dt in logs:
            if b_id not in book_scores:
                if act in ['wish_cancel', 'complete_cancel', 'cancel_complete']:
                    book_scores[b_id] = 0.0
                    book_vectors[b_id] = self._parse_vector(emb)
                    continue 

            days_diff = (now - dt).days
            decay = 0.5 ** (max(0, days_diff) / 7)
            current_score = (self.source_weights.get(src, 1.0) * self.action_weights.get(act, 1.0)) * decay
            
            if b_id not in book_scores:
                book_scores[b_id] = current_score
                book_vectors[b_id] = self._parse_vector(emb)
            else:
                if book_scores[b_id] > 0:
                    book_scores[b_id] = max(book_scores[b_id], current_score)
            
        total_vec = np.zeros(self.dim)
        for b_id, score in book_scores.items():
            if score > 0:
                total_vec += book_vectors[b_id] * score
                
        norm = np.linalg.norm(total_vec)
        return total_vec / norm if norm > 0 else total_vec

    def run_recommendation(self, user_id):
        conn = self._get_conn()
        cur = conn.cursor()
        try:
            cur.execute("DELETE FROM user_recommendation_pool WHERE user_id = %s", (user_id,))

            cur.execute("""
                SELECT count(DISTINCT book_id) FROM click_log 
                WHERE user_id = %s 
                  AND book_id NOT IN (
                      SELECT book_id FROM click_log 
                      WHERE user_id = %s AND action IN ('wish_cancel', 'complete_cancel', 'cancel_complete')
                  )
            """, (user_id, user_id))
            n_logs = cur.fetchone()[0]

            v_genre = self.get_genre_vector(user_id, cur)
            v_action = self.get_action_vector(user_id, cur)
            
            if n_logs == 0:    w_g, w_a = 0.5, 0.0
            elif n_logs <= 4:  w_g, w_a = 0.5, 0.2
            else:              w_g, w_a = 0.3, 0.7
                
            final_v = (v_genre * w_g) + (v_action * w_a)
            norm = np.linalg.norm(final_v)
            final_v = final_v / norm if norm > 0 else final_v
            final_v_list = final_v.tolist()

            cur.execute("UPDATE users SET embedding_vector = %s::vector WHERE id = %s", (final_v_list, user_id))

            if n_logs == 0:
                cur.execute("SELECT genre_id FROM users_genres WHERE user_id = %s", (user_id,))
                user_genres = [g[0] for g in cur.fetchall()]
                
                if user_genres:
                    limit_per_genre = 25 // len(user_genres)
                    extra = 25 % len(user_genres)
                    for i, g_id in enumerate(user_genres):
                        current_limit = limit_per_genre + (extra if i == 0 else 0)
                        # 중복 제거(DISTINCT) 후 밖에서 정렬(ORDER BY)
                        cur.execute(f"""
                            WITH RECURSIVE sub_genres AS (
                                SELECT id FROM genres WHERE id = %s
                                UNION ALL
                                SELECT g.id FROM genres g JOIN sub_genres sg ON g.parent_id = sg.id
                            )
                            INSERT INTO user_recommendation_pool (user_id, book_id, score, reason_type)
                            SELECT %s, sub.id, (1 - (sub.embedding_vector <=> %s::vector)), 'VECTOR'
                            FROM (
                                SELECT DISTINCT b.id, b.embedding_vector
                                FROM books b JOIN book_genres bg ON b.id = bg.book_id
                                WHERE bg.genre_id IN (SELECT id FROM sub_genres)
                                  AND b.id NOT IN (SELECT book_id FROM user_recommendation_pool WHERE user_id = %s)
                            ) sub
                            ORDER BY sub.embedding_vector <=> %s::vector LIMIT %s
                        """, (g_id, user_id, final_v_list, user_id, final_v_list, current_limit))
                
                cur.execute("SELECT count(*) FROM user_recommendation_pool WHERE user_id = %s", (user_id,))
                vec_filled = cur.fetchone()[0]
                counts = [('VECTOR', max(0, 25 - vec_filled)), ('RANDOM', 25)]
            
            elif n_logs <= 4:
                counts = [('VECTOR', 35), ('RANDOM', 15)]
            else:
                counts = [('VECTOR', 50)]

            for r_type, limit in counts:
                if limit <= 0: continue
                if r_type == 'VECTOR':
                    cur.execute(f"""
                        INSERT INTO user_recommendation_pool (user_id, book_id, score, reason_type)
                        SELECT %s, sub.id, (1 - (sub.embedding_vector <=> %s::vector)), 'VECTOR'
                        FROM (
                            SELECT DISTINCT id, embedding_vector FROM books
                            WHERE id NOT IN (SELECT book_id FROM user_recommendation_pool WHERE user_id = %s)
                              AND id NOT IN (SELECT book_id FROM click_log WHERE user_id = %s AND action = 'complete')
                        ) sub
                        ORDER BY sub.embedding_vector <=> %s::vector LIMIT %s
                    """, (user_id, final_v_list, user_id, user_id, final_v_list, limit))
                elif r_type == 'RANDOM':
                    # RANDOM() 오류 해결 핵심: DISTINCT 결과를 서브쿼리로 감싸고 밖에서 정렬
                    cur.execute("""
                        INSERT INTO user_recommendation_pool (user_id, book_id, score, reason_type)
                        SELECT %s, sub.id, 0.0, 'RANDOM'
                        FROM (
                            SELECT DISTINCT id FROM books
                            WHERE id NOT IN (SELECT book_id FROM user_recommendation_pool WHERE user_id = %s)
                              AND id NOT IN (SELECT book_id FROM click_log WHERE user_id = %s AND action = 'complete')
                        ) sub
                        ORDER BY RANDOM() LIMIT %s
                    """, (user_id, user_id, user_id, limit))
            
            conn.commit()
            logger.info(f"User {user_id} updated successfully.")
        except Exception as e:
            conn.rollback()
            logger.error(f"Error updating user {user_id}: {e}")
        finally:
            cur.close()
            self._put_conn(conn)

    def run_all_users_batch(self):
        logger.info("Daily batch process started.")
        conn = self._get_conn()
        cur = conn.cursor()
        cur.execute("SELECT id FROM users")
        user_ids = [r[0] for r in cur.fetchall()]
        cur.close()
        self._put_conn(conn)

        for idx, uid in enumerate(user_ids):
            self.run_recommendation(uid)
            if idx % 10 == 0:
                time.sleep(0.5) 
        
        logger.info(f"Daily batch completed. Total users: {len(user_ids)}")

class RecommendationManager:
    def __init__(self, service):
        self.service = service

    def check_new_users_and_run(self):
        conn = self.service._get_conn()
        cur = conn.cursor()
        try:
            cur.execute("""
                SELECT u.id FROM users u
                LEFT JOIN user_recommendation_pool p ON u.id = p.user_id
                WHERE p.user_id IS NULL
                LIMIT 5
            """)
            new_users = [r[0] for r in cur.fetchall()]
            
            if new_users:
                logger.info(f"New users detected: {new_users}. Generating recommendations...")
                for uid in new_users:
                    self.service.run_recommendation(uid)
        finally:
            cur.close()
            self.service._put_conn(conn)

    def start_batch_scheduler(self):
        schedule.every().day.at("00:00").do(self.service.run_all_users_batch)
        schedule.every(10).seconds.do(self.check_new_users_and_run)
        
        def run_loop():
            while True:
                try:
                    schedule.run_pending()
                except Exception as e:
                    logger.error(f"Scheduler loop error: {e}")
                time.sleep(1)
        
        threading.Thread(target=run_loop, daemon=True).start()
        logger.info("Background scheduler is running.")

if __name__ == "__main__":
    db_conf = {
        "host": os.getenv("DB_HOST"),
        "port": os.getenv("DB_PORT", "5432"),
        "user": os.getenv("DB_USERNAME"),
        "password": os.getenv("DB_PASSWORD"),
        "database": os.getenv("DB_NAME")
    }

    service = UserEmbeddingService(db_conf)
    manager = RecommendationManager(service)

    manager.start_batch_scheduler()
    
    while True:
        try:
            time.sleep(1)
        except KeyboardInterrupt:
            logger.info("Service stopping...")
            break