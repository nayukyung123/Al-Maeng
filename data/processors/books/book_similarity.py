import multiprocessing as mp
import os
import time

import psycopg2
from dotenv import load_dotenv
from psycopg2.extras import execute_batch


# .env에 있는 DB 접속 정보를 읽는다.
load_dotenv()

# 총 워커 수. 기본 실행 시 이 개수만큼 프로세스를 자동으로 띄운다.
WORKER_COUNT = 16

# 몇 권 처리할 때마다 commit 할지 결정한다.
# 중간에 프로세스가 끊겨도 손실 범위를 줄이기 위한 값이다.
COMMIT_EVERY = 100

# 한 책마다 저장할 유사 책 개수
TOP_K = 5

# INSERT 문을 몇 행씩 묶어서 보낼지 결정한다.
INSERT_BATCH_SIZE = 500

# 한 권에 대해 "같은 장르" 안에서 코사인 유사도 top K를 찾는 쿼리
# 한 책이 여러 장르를 가질 수 있으므로 같은 후보 책이 중복으로 나올 수 있는데,
# DISTINCT ON (b2.id)로 먼저 중복을 제거한 뒤 최종 점수 순으로 다시 정렬한다.
SIMILARITY_QUERY = """
SELECT
    ranked.similar_book_id,
    ranked.cosine_similarity
FROM (
    SELECT DISTINCT ON (b2.id)
        b2.id AS similar_book_id,
        1 - (b2.embedding_vector <=> b1.embedding_vector) AS cosine_similarity
    FROM books b1
    JOIN book_genres bg1
        ON bg1.book_id = b1.id
    JOIN book_genres bg2
        ON bg2.genre_id = bg1.genre_id
    JOIN books b2
        ON b2.id = bg2.book_id
    WHERE b1.id = %s
      AND b2.id <> b1.id
      AND b1.embedding_vector IS NOT NULL
      AND b2.embedding_vector IS NOT NULL
    ORDER BY b2.id, b2.embedding_vector <=> b1.embedding_vector
) ranked
ORDER BY ranked.cosine_similarity DESC
LIMIT %s
"""


def get_db_connection():
    # PostgreSQL books DB 연결 생성
    return psycopg2.connect(
        host=os.environ.get("DB_HOST"),
        dbname=os.environ.get("DB_NAME"),
        user=os.environ.get("DB_USER"),
        password=os.environ.get("DB_PASSWORD"),
        port=os.environ.get("DB_PORT"),
    )


def fetch_target_book_ids(cur, worker_index):
    # 처리 대상 책을 고를 때 두 가지 조건을 함께 사용한다.
    #
    # 1. embedding_vector가 이미 있어야 유사도 계산 가능
    # 2. book_similarity에 아직 기록되지 않은 책만 대상으로 삼아 재실행 시 skip
    #
    # 여기에 id %% WORKER_COUNT = worker_index 조건을 추가해서
    # 4개 워커가 서로 다른 책만 나눠 맡도록 만든다.
    cur.execute(
        """
        SELECT b.id
        FROM books b
        WHERE b.embedding_vector IS NOT NULL
          AND MOD(b.id, %s) = %s
          AND NOT EXISTS (
              SELECT 1
              FROM book_similarity bs
              WHERE bs.book_id = b.id
          )
        ORDER BY b.id
        """,
        (WORKER_COUNT, worker_index),
    )
    return [row[0] for row in cur.fetchall()]


def insert_similarity_rows(cur, rows):
    # 한 번 계산한 결과를 book_similarity에 모아서 INSERT 한다.
    # 현재 테이블 구조는 다음 3개 컬럼을 사용한다고 가정한다.
    # - book_id
    # - similiar_book_id
    # - similarity_score
    execute_batch(
        cur,
        """
        INSERT INTO book_similarity (
            book_id,
            similiar_book_id,
            similarity_score
        )
        VALUES (%s, %s, %s)
        """,
        rows,
        page_size=INSERT_BATCH_SIZE,
    )


def run_worker(worker_index):
    # 워커 번호 검증
    if worker_index < 0 or worker_index >= WORKER_COUNT:
        raise ValueError(
            f"worker_index must be between 0 and {WORKER_COUNT - 1}, got {worker_index}"
        )

    print(f"Preparing book similarity population (worker {worker_index + 1}/{WORKER_COUNT})...")

    with get_db_connection() as conn:
        # 일정 단위로 직접 commit 하기 위해 autocommit 비활성화
        conn.autocommit = False

        with conn.cursor() as cur:
            target_book_ids = fetch_target_book_ids(cur, worker_index)

            if not target_book_ids:
                print(f"[worker {worker_index}] No target books found. Nothing to do.")
                return

            print(f"[worker {worker_index}] Target books: {len(target_book_ids)}")

            processed_books = 0
            inserted_rows = 0
            pending_rows = []
            batch_started_at = time.perf_counter()

            for index, book_id in enumerate(target_book_ids, start=1):
                # 책 한 권에 대한 top K 유사 책 조회 시간 측정
                query_started_at = time.perf_counter()
                cur.execute(SIMILARITY_QUERY, (book_id, TOP_K))
                similar_rows = cur.fetchall()
                query_elapsed = time.perf_counter() - query_started_at

                # 조회된 top K 결과를 INSERT 대기 목록에 쌓아 둔다.
                for similar_book_id, similarity_score in similar_rows:
                    pending_rows.append((book_id, similar_book_id, float(similarity_score)))

                processed_books += 1

                # INSERT는 row 단위로 충분히 쌓였을 때 먼저 보내서
                # Python 메모리에 대기 목록이 과하게 쌓이지 않게 한다.
                if len(pending_rows) >= INSERT_BATCH_SIZE:
                    insert_similarity_rows(cur, pending_rows)
                    inserted_rows += len(pending_rows)
                    pending_rows.clear()

                # commit은 책 수 기준으로 끊는다.
                # 이렇게 하면 중간 실패 시 다시 시작했을 때 손실 범위가 제한되고,
                # 로그 단위도 책 처리량 기준으로 읽기 쉬워진다.
                if processed_books % COMMIT_EVERY == 0:
                    if pending_rows:
                        insert_similarity_rows(cur, pending_rows)
                        inserted_rows += len(pending_rows)
                        pending_rows.clear()

                    conn.commit()
                    batch_elapsed = time.perf_counter() - batch_started_at

                    print(
                        f"[worker {worker_index} | {index}/{len(target_book_ids)}] "
                        f"processed_books={processed_books} | "
                        f"inserted_rows={inserted_rows} | "
                        f"last_book_id={book_id} | "
                        f"last_query={query_elapsed * 1000:.2f}ms | "
                        f"batch_elapsed={batch_elapsed:.2f}s"
                    )

                    batch_started_at = time.perf_counter()

            # 마지막으로 남은 INSERT 대기 목록을 반영
            if pending_rows:
                insert_similarity_rows(cur, pending_rows)
                inserted_rows += len(pending_rows)

            # 마지막 commit
            conn.commit()

    print(f"[worker {worker_index}] Done.")
    print(f"[worker {worker_index}] processed books: {processed_books}")
    print(f"[worker {worker_index}] inserted rows: {inserted_rows}")


def main():
    # 기본 실행은 워커 4개를 자동으로 띄워 병렬 처리한다.
    #
    # 다만 디버깅이나 재실행 편의를 위해 WORKER_INDEX 환경 변수를 주면
    # 해당 워커 하나만 단독 실행할 수 있게 남겨둔다.
    worker_index_env = os.environ.get("WORKER_INDEX")
    if worker_index_env is not None:
        run_worker(int(worker_index_env))
        return

    print(f"Starting {WORKER_COUNT} workers...")

    processes = []
    for worker_index in range(WORKER_COUNT):
        process = mp.Process(target=run_worker, args=(worker_index,))
        process.start()
        processes.append(process)

    # 모든 워커가 끝날 때까지 기다린다.
    exit_codes = []
    for process in processes:
        process.join()
        exit_codes.append(process.exitcode)

    # 하나라도 실패한 워커가 있으면 메인 프로세스도 실패로 끝나게 한다.
    failed_codes = [code for code in exit_codes if code not in (0, None)]
    if failed_codes:
        raise SystemExit(f"Some workers failed: {failed_codes}")

    print("All workers completed successfully.")


if __name__ == "__main__":
    # 이 파일을 직접 실행했을 때만 배치 적재 수행
    main()
