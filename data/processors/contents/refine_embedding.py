#!/usr/bin/env python3
import os
import time
import logging
import sys
import psycopg2
from psycopg2.extras import RealDictCursor
from pathlib import Path
from dotenv import load_dotenv

# [1] 기존 임베딩 모듈 임포트 (Qwen 모델 로컬 GPU 엔진)
try:
    from embedding import get_embeddings
except ImportError:
    logging.error("❌ 'embedding.py' 파일을 찾을 수 없습니다. 같은 폴더에 있는지 확인해주세요.")
    sys.exit(1)

# [2] 설정 및 환경 변수 로드
current_file = Path(__file__).resolve()
data_dir = current_file.parent.parent.parent 
root_dir = data_dir.parent

load_dotenv(dotenv_path=root_dir / ".env")
load_dotenv(dotenv_path=data_dir / ".env", override=True)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s',
    handlers=[logging.StreamHandler(sys.stdout)]
)

def run_refinement():
    """
    테스트 코드에서 검증된 '탈-키워드' 서사 보정 로직을 전체 태그에 적용합니다.
    단순 키워드 매칭을 피하고 도서의 서사와 매칭되도록 임베딩 벡터를 재추출합니다.
    """
    db_params = {
        'host': os.getenv("DB_HOST", "127.0.0.1").strip(),
        'port': os.getenv("DB_PORT", "5433").strip(),
        'database': os.getenv("DB_NAME", "almaeng").strip(),
        'user': os.getenv("DB_USERNAME", "almaeng").strip(),
        'password': os.getenv("DB_PASSWORD", "almaeng").strip(),
        'options': "-c client_encoding=utf8"
    }
    
    try:
        conn = psycopg2.connect(**db_params)
        cur = conn.cursor(cursor_factory=RealDictCursor)
    except Exception as e:
        logging.error(f"❌ DB 연결 실패: {e}")
        return

    try:
        # contents 테이블과 JOIN하여 장르 정보를 함께 조회
        logging.info("🔍 보정할 전체 태그 및 장르 데이터 조회 중...")
        cur.execute("""
            SELECT t.id, t.tag_name, c.genres
            FROM tags t
            JOIN contents c ON t.content_id = c.id
            ORDER BY t.id ASC
        """)
        rows = cur.fetchall()
        total_count = len(rows)
        logging.info(f"📈 총 {total_count:,}개의 태그 벡터 보정(Anti-Keyword Trap) 시작...")

        batch_size = 32
        start_time = time.time()

        for i in range(0, total_count, batch_size):
            batch = rows[i:i+batch_size]
            enriched_texts = []
            
            for row in batch:
                genres = row['genres']
                tag_name = row['tag_name']
                genres_str = ", ".join(genres) if isinstance(genres, list) and genres else "정서적인"
                
                # [테스트 코드에서 가져온 핵심 보정 문구]
                # 임베딩 모델이 제목의 단어가 아닌 '이야기의 흐름'에 집중하도록 유도
                context_text = (
                    f"이 문구는 단순한 키워드가 아니라, [{genres_str}] 장르의 소설이 담고 있는 "
                    f"깊은 서사와 감정의 색채를 묘사합니다: '{tag_name}'. "
                    f"단순히 제목에 이 단어가 포함된 책이 아니라, 전체적인 이야기의 흐름과 분위기가 "
                    f"이 묘사와 일치하는 도서의 한 장면을 찾습니다."
                )
                enriched_texts.append(context_text)

            # 새 벡터 생성 (embedding.py의 Qwen 로직 사용)
            if get_embeddings:
                new_vectors = get_embeddings(enriched_texts)

                # DB 업데이트
                for row, vector in zip(batch, new_vectors):
                    vec_str = "[" + ",".join(map(str, vector)) + "]"
                    cur.execute("UPDATE tags SET embedding_vector = %s WHERE id = %s", (vec_str, row['id']))
            else:
                logging.error("❌ 임베딩 함수를 로드할 수 없어 작업을 중단합니다.")
                break
            
            conn.commit()
            
            # 진행 상황 로깅 (320건마다 출력)
            if (i + batch_size) % 320 == 0 or (i + batch_size) >= total_count:
                elapsed = time.time() - start_time
                avg_speed = (i + batch_size) / elapsed
                rem_time = (total_count - (i + batch_size)) / avg_speed if avg_speed > 0 else 0
                logging.info(f"   - 진행: {min(i + batch_size, total_count):,}/{total_count:,} 완료 (남은 시간: {rem_time/60:.1f}분)")

        logging.info("✅ 모든 태그의 임베딩 벡터가 '탈-키워드 서사형'으로 보정 완료되었습니다.")

    except Exception as e:
        conn.rollback()
        logging.error(f"❌ 오류 발생: {e}")
    finally:
        cur.close()
        conn.close()

if __name__ == "__main__":
    run_refinement()