#!/usr/bin/env python3
import os
import time
import logging
import sys
import re
import psycopg2
from pathlib import Path
from dotenv import load_dotenv
from concurrent.futures import ThreadPoolExecutor, as_completed
from psycopg2.extras import RealDictCursor, execute_batch

# 외부 서비스 함수 임포트
from tag import extract_tags_with_llm
from embedding import get_embeddings

# [1] 설정 및 경로 로드
current_file = Path(__file__).resolve()
data_dir = current_file.parent.parent.parent 
root_dir = data_dir.parent

load_dotenv(dotenv_path=root_dir / ".env")
load_dotenv(dotenv_path=data_dir / ".env", override=True)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(threadName)s] %(message)s',
    handlers=[logging.StreamHandler(sys.stdout)]
)

# [2] DB 접속 설정
def get_db_connection():
    return psycopg2.connect(
        host=os.getenv("DB_HOST", "127.0.0.1"),
        port=os.getenv("DB_PORT", "5433"),
        database=os.getenv("DB_NAME", "almaeng"),
        user=os.getenv("DB_USERNAME", "almaeng"),
        password=os.getenv("DB_PASSWORD", "almaeng"),
        options="-c client_encoding=utf8"
    )

# [3] 처리 성능 설정
MAX_WORKERS = 10 
FETCH_SIZE = 40
DELAY_PER_REQ = 1.5

def fetch_work_batch(cur, limit):
    """
    작업할 데이터를 조회합니다. 
    1. 먼저 READY 상태를 가져옵니다.
    2. READY가 없으면 FAILED 상태를 가져와서 재시도합니다.
    """
    cur.execute("""
        SELECT id, title, description, genres, keywords 
        FROM contents 
        WHERE tag_status = 'READY' 
        ORDER BY id ASC LIMIT %s
    """, (limit,))
    rows = cur.fetchall()
    if rows:
        return rows, "READY"

    cur.execute("""
        SELECT id, title, description, genres, keywords 
        FROM contents 
        WHERE tag_status = 'FAILED' 
        ORDER BY id ASC LIMIT %s
    """, (limit,))
    rows = cur.fetchall()
    if rows:
        logging.info("⚠️ READY 데이터가 없어 FAILED 상태 데이터를 재시도합니다.")
        return rows, "RETRY_FAILED"
        
    return [], None

def process_single_row(row):
    """자동화 파이프라인: 태그 생성 -> 문맥 보강(Anti-Keyword) -> 임베딩 -> 저장"""
    c_id = row['id']
    title = row['title']
    
    time.sleep(DELAY_PER_REQ)
    conn = get_db_connection()
    cur = conn.cursor()
    
    try:
        cur.execute("UPDATE contents SET tag_status = 'PROCESSING' WHERE id = %s", (c_id,))
        conn.commit()

        # 1. LLM 태그 생성 (GPT-4o-mini)
        genres = row['genres']
        genres_str = ", ".join(genres) if isinstance(genres, list) else str(genres or "정서적인")
        keywords_str = ", ".join(row['keywords']) if isinstance(row['keywords'], list) else str(row['keywords'] or "")
        
        raw_tags = extract_tags_with_llm(
            title, genres_str, row['description'], keywords_str, 
            os.getenv("GMS_KEY"), os.getenv("GMS_ENDPOINT")
        )
        
        if not raw_tags: raise Exception("LLM 응답 없음")
        tags_text = [re.sub(r'^[0-9\.\-\s·]+', '', line).strip() for line in raw_tags.split('\n') if len(line.strip()) > 5][:3]
        if len(tags_text) < 3: raise Exception("태그 부족")

        # 2. [핵심] '탈-키워드' 고품질 문맥 보정 (Anti-Keyword Trap)
        enriched_queries = []
        for t in tags_text:
            context_text = (
                f"이 문구는 단순한 키워드가 아니라, [{genres_str}] 장르의 소설이 담고 있는 "
                f"깊은 서사와 감정의 색채를 묘사합니다: '{t}'. "
                f"단순히 제목에 이 단어가 포함된 책이 아니라, 전체적인 이야기의 흐름과 분위기가 "
                f"이 묘사와 일치하는 도서의 한 장면을 찾습니다."
            )
            enriched_queries.append(context_text)

        # 3. 보정된 텍스트로 임베딩 추출
        vectors = get_embeddings(enriched_queries)
        
        if not vectors or len(vectors) < 3:
            raise Exception("임베딩 벡터 생성 실패")

        # 4. DB 저장
        tag_data = []
        for tag_name, vector in zip(tags_text, vectors):
            vec_str = "[" + ",".join(map(str, vector)) + "]"
            tag_data.append((c_id, tag_name, vec_str))

        execute_batch(cur, """
            INSERT INTO tags (content_id, tag_name, embedding_vector) 
            VALUES (%s, %s, %s::vector)
        """, tag_data)

        cur.execute("UPDATE contents SET tag_status = 'COMPLETED' WHERE id = %s", (c_id,))
        conn.commit()
        return f"✅ 성공: {title}"

    except Exception as e:
        conn.rollback()
        cur.execute("UPDATE contents SET tag_status = 'FAILED' WHERE id = %s", (c_id,))
        conn.commit()
        return f"❌ 실패: {title} - {str(e)}"
    finally:
        cur.close()
        conn.close()

def main():
    """메인 실행 루프: 데이터 조회 및 병렬 처리를 관리합니다."""
    logging.info(f"🚀 가공 엔진 시작 (Workers: {MAX_WORKERS}, Delay: {DELAY_PER_REQ}s)")
    
    try:
        while True:
            # DB에서 한 배치만큼 작업 가져오기
            conn = get_db_connection()
            cur = conn.cursor(cursor_factory=RealDictCursor)
            rows, mode = fetch_work_batch(cur, FETCH_SIZE)
            cur.close()
            conn.close()

            # 처리할 데이터가 없는 경우
            if not rows:
                logging.info("🎉 모든 작업이 완료되었습니다(READY/FAILED 없음). 60초 후 다시 확인합니다.")
                time.sleep(60)
                continue

            # ThreadPoolExecutor를 이용한 병렬 처리
            with ThreadPoolExecutor(max_workers=MAX_WORKERS, thread_name_prefix="Worker") as executor:
                try:
                    futures = [executor.submit(process_single_row, row) for row in rows]
                    for future in as_completed(futures):
                        logging.info(future.result())
                except KeyboardInterrupt:
                    # Ctrl+C 감지 시 현재 진행 중인 작업만 마무리하고 중단
                    logging.warning("\n🛑 사용자가 중단을 요청했습니다. 작업을 정리하고 종료합니다...")
                    executor.shutdown(wait=False, cancel_futures=True)
                    raise 

            # 모드에 따른 휴식 시간 조정
            if mode == "RETRY_FAILED":
                logging.info("FAILED 데이터 배치를 완료했습니다. 10초간 휴식합니다.")
                time.sleep(10)
            else:
                time.sleep(1)

    except KeyboardInterrupt:
        logging.info("👋 프로그램을 안전하게 종료했습니다.")
        sys.exit(0)
    except Exception as e:
        logging.error(f"❌ 메인 루프 치명적 오류: {e}")
        time.sleep(10)

if __name__ == "__main__":
    main()