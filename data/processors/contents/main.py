#!/usr/bin/env python3
import os
import time
import logging
import sys
import re
from pathlib import Path
from dotenv import load_dotenv
from concurrent.futures import ThreadPoolExecutor, as_completed

import psycopg2
from psycopg2.extras import RealDictCursor, execute_batch

# 외부 서비스 모듈 임포트
from tag import extract_tags_with_llm
from embedding import get_embeddings

# [1] 경로 설정 및 환경 변수 로드
current_file = Path(__file__).resolve()
# 현재 위치: /data/processors/contents/main.py -> data_dir: /data/ -> root_dir: / (al-maeng_test)
data_dir = current_file.parent.parent.parent 
root_dir = data_dir.parent

# 로깅 설정: 시간, 스레드 이름, 메시지를 포함하여 출력
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(threadName)s] %(message)s',
    handlers=[logging.StreamHandler(sys.stdout)]
)

# .env 파일 로드 (루트 및 데이터 폴더 탐색)
if (root_dir / ".env").exists():
    load_dotenv(dotenv_path=root_dir / ".env")
    logging.info(f"✅ 루트 .env 로드 완료: {root_dir / '.env'}")
if (data_dir / ".env").exists():
    load_dotenv(dotenv_path=data_dir / ".env", override=True)
    logging.info(f"✅ 데이터 .env 로드 완료: {data_dir / '.env'}")

# [2] DB 및 API 접속 정보 매핑
DB_HOST = os.getenv("DB_HOST", "127.0.0.1")
DB_PORT = os.getenv("DB_PORT", "5433")
DB_NAME = os.getenv("DB_NAME", "almaeng")
DB_USER = os.getenv("DB_USERNAME", "almaeng")
DB_PASSWORD = os.getenv("DB_PASSWORD", "almaeng")

# GMS API 설정
GMS_KEY = os.getenv("GMS_KEY", "").strip()
GMS_ENDPOINT = os.getenv("GMS_ENDPOINT", "https://gms.ssafy.io/gmsapi/api.openai.com/v1").strip().rstrip('/')

# 엔드포인트 경로 보정
if "/chat/completions" in GMS_ENDPOINT:
    GMS_ENDPOINT = GMS_ENDPOINT.replace("/chat/completions", "").rstrip('/')

# [3] 처리 성능 설정 (10워커 밸런스 모드 - 안정성 강화)
# 사용자 경험을 바탕으로 10개의 병렬 워커를 할당하여 속도와 안정성의 균형을 맞춥니다.
MAX_WORKERS = 10       # 동시 처리 워커 (속도 확보를 위해 10으로 설정)
FETCH_SIZE = 40        # 한 번에 큐에 담기 위해 가져오는 데이터 양
DELAY_PER_REQ = 1.5    # 요청 간 최소 대기 시간 (안정성을 위해 1.5초로 상향)

def get_db_connection():
    """환경 변수를 사용하여 데이터베이스에 연결합니다."""
    return psycopg2.connect(
        host=DB_HOST,
        port=DB_PORT,
        database=DB_NAME,
        user=DB_USER,
        password=DB_PASSWORD
    )

def vector_to_pgvector(vector):
    """리스트 형태의 벡터를 pgvector용 문자열 포맷([0.1, 0.2...])으로 변환합니다."""
    return "[" + ",".join(f"{float(value):.8f}" for value in vector) + "]"

def fetch_work_batch(cur, limit):
    """
    작업할 데이터를 조회합니다. 
    1. 먼저 READY 상태를 가져옵니다.
    2. READY가 없으면 FAILED 상태를 가져와서 재시도합니다.
    """
    # 우선 순위 1: READY 데이터
    cur.execute("""
        SELECT id, title, description, genres, keywords 
        FROM contents 
        WHERE tag_status = 'READY' 
        ORDER BY id ASC
        LIMIT %s
    """, (limit,))
    rows = cur.fetchall()
    
    if rows:
        return rows, "READY"

    # 우선 순위 2: FAILED 데이터 (READY가 더 이상 없을 때만 시도)
    cur.execute("""
        SELECT id, title, description, genres, keywords 
        FROM contents 
        WHERE tag_status = 'FAILED' 
        ORDER BY id ASC
        LIMIT %s
    """, (limit,))
    rows = cur.fetchall()
    
    if rows:
        logging.info("⚠️ READY 데이터가 없어 FAILED 상태 데이터를 재시도합니다.")
        return rows, "RETRY_FAILED"
        
    return [], None

def process_single_row(row):
    """개별 콘텐츠에 대해 태그 생성 및 임베딩을 수행하는 워커 함수입니다."""
    c_id = row['id']
    title = row['title']
    
    # API 서버 부하를 조절하기 위한 미세 대기
    time.sleep(DELAY_PER_REQ)
    
    conn = get_db_connection()
    cur = conn.cursor()
    
    try:
        # 1. 상태 변경: PROCESSING
        cur.execute("UPDATE contents SET tag_status = 'PROCESSING' WHERE id = %s", (c_id,))
        conn.commit()

        # 2. LLM 태그 생성 (실패 시 지수 백오프 적용)
        # 장르와 키워드 데이터를 문자열로 병합
        genres_str = ", ".join(row['genres']) if isinstance(row['genres'], list) else str(row['genres'] or "")
        keywords_str = ", ".join(row['keywords']) if isinstance(row['keywords'], list) else str(row['keywords'] or "")
        
        raw_tags = None
        for attempt in range(5):
            raw_tags = extract_tags_with_llm(
                title, genres_str, row['description'], keywords_str, 
                GMS_KEY, GMS_ENDPOINT
            )
            if raw_tags:
                break
            
            # 실패 시 대기 시간 증가 (1s, 2s, 4s, 8s, 16s)
            wait_time = (2 ** attempt) + 1
            logging.warning(f"⚠️ [{title}] API 응답 지연으로 {wait_time}초 후 재시도 중... ({attempt+1}/5)")
            time.sleep(wait_time)
        
        if not raw_tags:
            raise Exception("LLM 응답이 5회 시도 후에도 비어있습니다.")
            
        # 태그 정제 (불필요한 숫자/기호 제거 및 유효 길이 필터링)
        tags_text = [re.sub(r'^[0-9\.\-\s·]+', '', line).strip() for line in raw_tags.split('\n') if len(line.strip()) > 5]
        
        if len(tags_text) < 3:
            raise Exception(f"태그 생성 개수 부족: {len(tags_text)}개")

        # 3. 임베딩 추출 (상위 3개 태그 대상)
        vectors = get_embeddings(tags_text[:3])
        
        if not vectors or len(vectors) < 3:
            raise Exception("임베딩 벡터 생성 실패")

        # 4. tags 테이블에 데이터 적재 (execute_batch를 이용한 효율적 삽입)
        tag_data = [
            (c_id, tag_name, vector_to_pgvector(vector))
            for tag_name, vector in zip(tags_text[:3], vectors)
        ]
        
        execute_batch(cur, """
            INSERT INTO tags (content_id, tag_name, embedding_vector)
            VALUES (%s, %s, %s::vector)
        """, tag_data)

        # 5. 모든 과정 성공 시 COMPLETED로 변경
        cur.execute("UPDATE contents SET tag_status = 'COMPLETED' WHERE id = %s", (c_id,))
        conn.commit()
        return f"✅ 성공: {title}"

    except Exception as e:
        # 오류 발생 시 롤백 및 FAILED 상태 기록
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