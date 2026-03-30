#!/usr/bin/env python3
import os
import time
import logging
import sys
import psycopg2
import random  # 추천 다양성을 위한 무작위 셔플용
from pathlib import Path
from dotenv import load_dotenv
from concurrent.futures import ThreadPoolExecutor, as_completed
from psycopg2.extras import RealDictCursor, execute_values
from psycopg2.pool import ThreadedConnectionPool

# [1] 설정 및 환경 변수 로드
current_file = Path(__file__).resolve()
analysis_dir = current_file.parent
data_dir = analysis_dir.parent
root_dir = data_dir.parent

load_dotenv(dotenv_path=root_dir / ".env")
load_dotenv(dotenv_path=data_dir / ".env", override=True)

# 진행 상태를 저장할 로컬 파일
PROGRESS_FILE = analysis_dir / "mapping_progress.txt"

# 로깅 설정
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(threadName)s] %(message)s',
    handlers=[logging.StreamHandler(sys.stdout)]
)

# [2] DB 커넥션 풀 설정
DB_CONFIG = {
    'host': os.getenv("DB_HOST", "127.0.0.1").strip(),
    'port': os.getenv("DB_PORT", "5432").strip(), 
    'database': os.getenv("DB_NAME", "almaeng").strip(),
    'user': os.getenv("DB_USERNAME", "almaeng").strip(),
    'password': os.getenv("DB_PASSWORD", "almaeng").strip(),
    'connect_timeout': 10,
    'options': "-c client_encoding=utf8 -c statement_timeout=60000"
}

db_pool = ThreadedConnectionPool(minconn=5, maxconn=20, **DB_CONFIG)

# 소설/시/희곡 대분류 ID
FICTION_GENRE_ID = 27594
# 사용자 요청 필터링 키워드 반영 (최종 업데이트 버전)
EXCLUDE_KEYWORDS = '가이드|컬러링|플롯|작법|워크북|쓰는 법|필사|연습장|스토리텔링|창작|교본|원작소설|스토리|SF 보다|글쓰기|첫 문장|원작'

def get_target_genre_ids():
    """소설 및 하위 장르 ID 목록 캐싱"""
    conn = db_pool.getconn()
    try:
        with conn.cursor() as cur:
            cur.execute(f"SELECT id FROM genres WHERE id = {FICTION_GENRE_ID} OR parent_id = {FICTION_GENRE_ID}")
            return tuple(row[0] for row in cur.fetchall())
    finally:
        db_pool.putconn(conn)

def load_progress():
    if PROGRESS_FILE.exists():
        try:
            with open(PROGRESS_FILE, "r") as f:
                return int(f.read().strip())
        except: return 0
    return 0

def save_progress(index):
    with open(PROGRESS_FILE, "w") as f:
        f.write(str(index))

def fetch_book_candidates(cur, tag_vector, limit, target_genres=None):
    """
    유사도가 높은 도서 후보군을 대량으로 가져옵니다.
    """
    params = [tag_vector]
    where_clauses = [
        "b.embedding_vector IS NOT NULL",
        f"b.title !~* '{EXCLUDE_KEYWORDS}'" # 필터링 적용
    ]

    if target_genres:
        where_clauses.append("EXISTS (SELECT 1 FROM book_genres bg WHERE bg.book_id = b.id AND bg.genre_id IN %s)")
        params.append(target_genres)

    params.append(tag_vector)

    query = f"""
        SELECT b.id, b.page_count, 1 - (b.embedding_vector <=> %s) AS score
        FROM books b
        WHERE {' AND '.join(where_clauses)}
        ORDER BY b.embedding_vector <=> %s
        LIMIT {limit}
    """
    cur.execute(query, params)
    return cur.fetchall()

def fetch_fallback_books(cur, tag_vector, limit, exclude_ids):
    """후보군이 부족할 때 장르/분량 상관없이 유사도가 높은 도서를 보충합니다."""
    params = [tag_vector]
    where_clauses = ["b.embedding_vector IS NOT NULL", f"b.title !~* '{EXCLUDE_KEYWORDS}'"]
    
    if exclude_ids:
        where_clauses.append("b.id NOT IN %s")
        params.append(tuple(exclude_ids))
    
    params.append(tag_vector)
    
    query = f"""
        SELECT b.id, 1 - (b.embedding_vector <=> %s) AS score
        FROM books b
        WHERE {' AND '.join(where_clauses)}
        ORDER BY b.embedding_vector <=> %s
        LIMIT {limit}
    """
    cur.execute(query, params)
    return cur.fetchall()

def categorize_by_length(page_count):
    # page_count가 None(NULL)인 경우 에러 방지를 위한 예외 처리
    if page_count is None:
        return None
    if 0 < page_count < 200: return 'LIGHT'
    if 200 <= page_count <= 400: return 'MEDIUM'
    if page_count > 400: return 'LONG'
    return None

def process_content_chunk(chunk, target_genres):
    results = []
    conn = db_pool.getconn()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    try:
        for content in chunk:
            tags = content['tags']
            used_in_content = set()
            
            for tag in tags:
                tag_id, tag_vector = tag['id'], tag['embedding_vector']
                
                # 상위 100권의 후보군 확보 (Relevance 확보)
                candidates = fetch_book_candidates(cur, tag_vector, 100, target_genres)
                
                # [다양성 강화] 후보군 무작위 셔플 (Diversity 확보)
                random.shuffle(candidates)
                
                buckets = {'LIGHT': [], 'MEDIUM': [], 'LONG': []}
                for b in candidates:
                    l_type = categorize_by_length(b['page_count'])
                    if l_type and b['id'] not in used_in_content and len(buckets[l_type]) < 5:
                        buckets[l_type].append(b)
                        used_in_content.add(b['id'])

                # 4단계 폴백 로직: 부족한 슬롯 채우기
                for l_type in ['LIGHT', 'MEDIUM', 'LONG']:
                    if len(buckets[l_type]) < 5:
                        needed = 5 - len(buckets[l_type])
                        fallbacks = fetch_fallback_books(cur, tag_vector, needed, used_in_content)
                        buckets[l_type].extend(fallbacks)
                        for f in fallbacks: used_in_content.add(f['id'])

                    # 결과 리스트 적재
                    for rank, book in enumerate(buckets[l_type], 1):
                        results.append((
                            book['id'], tag_id, round(float(book['score']), 4), rank, l_type
                        ))
                        
        return results
    except Exception as e:
        logging.error(f"❌ 워커 오류 발생: {e}")
        return []
    finally:
        cur.close()
        db_pool.putconn(conn)

def main():
    logging.info("🚀 [Performance & Diversity Optimized Mode] 매핑 시작")
    target_genres = get_target_genre_ids()
    last_idx = load_progress()

    conn = db_pool.getconn()
    cur = conn.cursor(name='tag_mapping_ultimate', cursor_factory=RealDictCursor)
    cur.itersize = 1000 
    
    try:
        logging.info("📥 태그 데이터 스트리밍 조회 중...")
        cur.execute("""
            SELECT content_id, json_agg(json_build_object('id', id, 'embedding_vector', embedding_vector)) as tags
            FROM tags
            GROUP BY content_id
            ORDER BY content_id ASC
        """)

        total_inserted = 0
        BATCH_SIZE = 100
        MAX_WORKERS = 10
        global_count = 0
        batch_rows = []
        
        start_time = time.time()

        with ThreadPoolExecutor(max_workers=MAX_WORKERS, thread_name_prefix="Worker") as executor:
            for row in cur:
                global_count += 1
                if global_count <= last_idx: continue
                batch_rows.append(row)
                
                if len(batch_rows) >= BATCH_SIZE:
                    sub_chunks = [batch_rows[j:j+10] for j in range(0, len(batch_rows), 10)]
                    futures = [executor.submit(process_content_chunk, sc, target_genres) for sc in sub_chunks]
                    
                    batch_results = []
                    for future in as_completed(futures):
                        batch_results.extend(future.result())
                    
                    if batch_results:
                        save_conn = db_pool.getconn()
                        with save_conn.cursor() as ins_cur:
                            execute_values(ins_cur, """
                                INSERT INTO tag_book_recommendations (book_id, tag_id, score, rank, length_type)
                                VALUES %s ON CONFLICT DO NOTHING
                            """, batch_results)
                        save_conn.commit()
                        db_pool.putconn(save_conn)
                        total_inserted += len(batch_results)
                    
                    save_progress(global_count)
                    elapsed = time.time() - start_time
                    avg_speed = (global_count - last_idx) / elapsed
                    rem_time = (73348 - global_count) / avg_speed if avg_speed > 0 else 0
                    logging.info(f"📍 {global_count:,}/73,348 | 적재: {total_inserted:,} | {avg_speed:.1f} mov/s | 남은 시간: {rem_time/60:.1f}분")
                    batch_rows = []

            if batch_rows:
                final_res = process_content_chunk(batch_rows, target_genres)
                if final_res:
                    save_conn = db_pool.getconn()
                    with save_conn.cursor() as ins_cur:
                        execute_values(ins_cur, """
                            INSERT INTO tag_book_recommendations (book_id, tag_id, score, rank, length_type)
                            VALUES %s ON CONFLICT DO NOTHING
                        """, final_res)
                    save_conn.commit()
                    db_pool.putconn(save_conn)
                    total_inserted += len(final_res)

    finally:
        cur.close()
        db_pool.putconn(conn)
        db_pool.closeall()
        logging.info(f"✅ 모든 작업 완료! 총 {total_inserted:,}행 저장.")

if __name__ == "__main__":
    main()