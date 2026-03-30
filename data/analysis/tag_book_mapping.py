#!/usr/bin/env python3
import os
import time
import logging
import sys
import psycopg2
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

PROGRESS_FILE = analysis_dir / "mapping_progress.txt"

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(threadName)s] %(message)s',
    handlers=[logging.StreamHandler(sys.stdout)]
)

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

def get_target_genre_ids():
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

def fetch_books_flexible(cur, tag_vector, limit, exclude_ids, target_genres=None, condition=None):
    """
    조건에 맞춰 도서를 검색하는 유연한 쿼리 함수
    - [1] 하드코딩 필터링: !~* 연산자를 사용하여 비소설 키워드 제외
    """
    params = [tag_vector]
    # 임베딩 데이터가 있는 것만 조회
    where_clauses = ["b.embedding_vector IS NOT NULL"]

    # --- [1] 하드코딩 필터링 (정규식 오류 수정: !~* 사용) ---
    exclude_keywords = '가이드|컬러링|플롯|작법|워크북|쓰는 법|필사|연습장|스토리텔링|창작|교본'
    where_clauses.append(f"b.title !~* '{exclude_keywords}'")

    if target_genres:
        where_clauses.append("EXISTS (SELECT 1 FROM book_genres bg WHERE bg.book_id = b.id AND bg.genre_id IN %s)")
        params.append(target_genres)

    if condition:
        where_clauses.append(condition)

    if exclude_ids:
        where_clauses.append("b.id NOT IN %s")
        params.append(tuple(exclude_ids))

    params.append(tag_vector) # ORDER BY용

    query = f"""
        SELECT b.id, 1 - (b.embedding_vector <=> %s) AS score
        FROM books b
        WHERE {' AND '.join(where_clauses)}
        ORDER BY b.embedding_vector <=> %s
        LIMIT {limit}
    """
    cur.execute(query, params)
    return cur.fetchall()

def process_content_chunk(chunk, target_genres):
    """
    [4단계 폴백 로직 워커]
    1. 필터링 (모든 단계 공통)
    2. 분량 태그별 가져오기 (장르 포함, 줄거리 제한 없음)
    3. 만약 5권 안차면: 장르 무시 (분량 유지)
    4. 그래도 안차면: 분량 무시 (전체 유사도 추천)
    """
    results = []
    conn = db_pool.getconn()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    length_filters = {
        'LIGHT': 'b.page_count > 0 AND b.page_count < 200',
        'MEDIUM': 'b.page_count >= 200 AND b.page_count <= 400',
        'LONG': 'b.page_count > 400'
    }

    try:
        for content in chunk:
            tags = content['tags']
            picked_in_movie = {'LIGHT': set(), 'MEDIUM': set(), 'LONG': set()}
            
            for tag in tags:
                tag_id, tag_vector = tag['id'], tag['embedding_vector']
                
                for l_type, condition in length_filters.items():
                    # --- [Step 2] 분량 태그별 가져오기 (장르 포함) ---
                    books = fetch_books_flexible(cur, tag_vector, 5, picked_in_movie[l_type], target_genres, condition)

                    # --- [Step 3] 장르 무시 (분량 조건 유지) ---
                    if len(books) < 5:
                        current_ids = picked_in_movie[l_type] | {b['id'] for b in books}
                        needed = 5 - len(books)
                        more = fetch_books_flexible(cur, tag_vector, needed, current_ids, None, condition)
                        books.extend(more)

                    # --- [Step 4] 분량 무시 (최종 유사도 매칭) ---
                    if len(books) < 5:
                        current_ids = picked_in_movie[l_type] | {b['id'] for b in books}
                        needed = 5 - len(books)
                        more = fetch_books_flexible(cur, tag_vector, needed, current_ids, None, None)
                        books.extend(more)

                    # 결과 적재
                    for rank, book in enumerate(books, 1):
                        results.append((
                            book['id'], tag_id, round(float(book['score']), 4), rank, l_type
                        ))
                        picked_in_movie[l_type].add(book['id'])
                        
        return results
    except Exception as e:
        logging.error(f"❌ 데이터 처리 중 오류 발생: {e}")
        return []
    finally:
        cur.close()
        db_pool.putconn(conn)

def main():
    logging.info("🚀 [Step-by-Step Fallback Mode] 매핑 시작")
    target_genres = get_target_genre_ids()
    last_idx = load_progress()

    conn = db_pool.getconn()
    cur = conn.cursor(name='tag_mapping_final', cursor_factory=RealDictCursor)
    cur.itersize = 1000 
    
    try:
        logging.info("📥 태그 데이터 로딩 중...")
        cur.execute("""
            SELECT content_id, json_agg(json_build_object('id', id, 'embedding_vector', embedding_vector)) as tags
            FROM tags
            GROUP BY content_id
            ORDER BY content_id ASC
        """)

        total_inserted = 0
        BATCH_SIZE = 120
        MAX_WORKERS = 12
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
                    logging.info(f"📍 진행: {global_count:,}/73,348 | 적재됨: {total_inserted:,}행 | 속도: {avg_speed:.2f} mov/s | 남은 시간: {rem_time/60:.1f}분")
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
        logging.info(f"✅ 작업 완료! 4단계 폴백 로직이 모두 적용되었습니다.")

if __name__ == "__main__":
    main()