import asyncio
from multiprocessing import Process

from config import GENRES
from crawler import crawl_category, fetch_books_async
from db import (
    get_db_connection,
    get_or_create_genre,
    insert_book,
    insert_book_genre,
)

# -----------------------------
# 실행
# -----------------------------
def process_range(worker_name, start_page, end_page):

    conn = get_db_connection()
    cur = conn.cursor()

    try:
        for genre_name, cid in GENRES.items():

            print(f"\n[{worker_name}] {genre_name}")

            # -----------------------------
            # 1. 크롤링
            # -----------------------------
            item_ids = crawl_category(cid, start_page, end_page)
            print(f"[{worker_name}] crawl count: {len(item_ids)}")

            if not item_ids:
                continue

            # -----------------------------
            # 2. API 호출
            # -----------------------------
            books = asyncio.run(fetch_books_async(item_ids))
            print(f"[{worker_name}] api count: {len(books)}")

            # -----------------------------
            # 3. DB 적재
            # -----------------------------
            inserted_count = 0
            skipped_count = 0

            for book in books:
                try:
                    book_id = insert_book(cur, book)

                    # 이미 존재하면 skip
                    if not book_id:
                        skipped_count += 1
                        continue

                    inserted_count += 1

                    for parent, child in book["categories"]:
                        parent_id = get_or_create_genre(cur, parent, None)
                        child_id = get_or_create_genre(cur, child, parent_id)
                        insert_book_genre(cur, book_id, child_id)
                
                except Exception as exc:
                    conn.rollback()
                    print(f"[{worker_name}] insert error: {exc}")

            conn.commit()

            print(
                f"[{worker_name}] 적재 완료: "
                f"inserted={inserted_count}, skipped={skipped_count}"
            )
    finally:
        cur.close()
        conn.close()

def split_page_ranges(start_page, end_page, worker_count):
    # 전체 페이지 수 계산 (inclusive)
    total_pages = end_page - start_page + 1

    # 워커 수가 페이지 수보다 많으면 의미 없으므로 제한
    worker_count = min(worker_count, total_pages)

    # 각 워커가 기본적으로 맡을 페이지 수
    base_size = total_pages // worker_count

    # 나머지 페이지 (앞쪽 워커들에게 1페이지씩 더 분배)
    remainder = total_pages % worker_count

    ranges = []
    current = start_page  # 현재 시작 페이지 포인터

    # 워커별로 페이지 범위 분배
    for index in range(worker_count):

        # 앞쪽 워커부터 remainder만큼 +1 페이지 추가
        extra = 1 if index < remainder else 0

        # 실제 할당될 페이지 수
        chunk_size = base_size + extra

        # 현재 워커의 시작/끝 페이지
        chunk_start = current
        chunk_end = current + chunk_size - 1

        # (워커 이름, 시작 페이지, 끝 페이지) 형태로 저장
        ranges.append((f"W{index + 1}", chunk_start, chunk_end))

        # 다음 워커를 위해 포인터 이동
        current = chunk_end + 1

    return ranges


def run_multi(start_page, end_page, worker_count):
    # 입력값 검증: 시작 페이지가 끝 페이지보다 크면 오류
    if start_page > end_page:
        raise ValueError("start_page must be less than or equal to end_page")

    # 워커 수는 최소 1 이상이어야 함
    if worker_count < 1:
        raise ValueError("worker_count must be at least 1")

    # 페이지 범위를 워커 수만큼 분할
    workers = split_page_ranges(start_page, end_page, worker_count)

    processes = []

    # 각 워커를 별도 프로세스로 실행
    for worker_name, range_start, range_end in workers:
        process = Process(
            target=process_range,                # 실행할 함수
            args=(worker_name, range_start, range_end),  # 인자 전달
        )
        process.start()  # 프로세스 시작
        processes.append(process)

    # 모든 프로세스 종료까지 대기
    for process in processes:
        process.join()


if __name__ == "__main__":
    # 사용자 입력으로 실행 범위 설정
    start_page = int(input("시작 페이지를 입력하세요: "))
    end_page = int(input("끝 페이지를 입력하세요: "))
    worker_count = int(input("워커 수를 입력하세요: "))

    # 멀티프로세싱 실행
    run_multi(start_page, end_page, worker_count)