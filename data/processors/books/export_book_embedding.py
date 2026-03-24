import csv
import os
from pathlib import Path

import psycopg2
from dotenv import load_dotenv


# .env에 있는 DB 접속 정보를 현재 프로세스로 불러온다.
load_dotenv()


def get_db_connection():
    # 로컬 PostgreSQL books DB에 접속할 때 사용하는 공통 함수
    return psycopg2.connect(
        host=os.environ.get("DB_HOST"),
        dbname=os.environ.get("DB_NAME"),
        user=os.environ.get("DB_USER"),
        password=os.environ.get("DB_PASSWORD"),
        port=os.environ.get("DB_PORT"),
    )


def main():
    # TSV를 기본값으로 사용한다.
    # embedding_vector 내부에는 쉼표가 많기 때문에 CSV보다 탭 구분이 더 안전하다.
    output_path = Path(__file__).with_name("book_embeddings.tsv")

    # 임베딩이 채워진 책만 가져와서 id와 벡터 문자열 형태로 추출한다.
    # embedding_vector::text 로 캐스팅하면 pgvector 값을 파일로 옮기기 쉬운 문자열로 받을 수 있다.
    query = """
        SELECT id, embedding_vector::text
        FROM books
        WHERE embedding_vector IS NOT NULL
        ORDER BY id
    """

    print(f"Exporting embeddings to {output_path}...")

    row_count = 0

    with get_db_connection() as conn:
        # 서버사이드 커서를 사용해 한 번에 전부 메모리에 올리지 않고
        # 일정량씩 스트리밍하면서 파일로 내보낸다.
        with conn.cursor(name="book_embedding_export") as cur:
            cur.itersize = 5000
            cur.execute(query)

            with output_path.open("w", encoding="utf-8", newline="") as f:
                # 탭 구분 TSV 파일 작성기
                writer = csv.writer(
                    f,
                    delimiter="\t",
                    quoting=csv.QUOTE_MINIMAL,
                )

                # 첫 줄 헤더는 EC2에서 \copy 할 때 그대로 사용한다.
                writer.writerow(["id", "embedding_vector"])

                for book_id, embedding_vector in cur:
                    # 책 ID와 벡터 문자열을 한 줄씩 기록
                    writer.writerow([book_id, embedding_vector])
                    row_count += 1

                    # 진행 상황을 너무 자주 찍지 않도록 1만 건 단위로 로그 출력
                    if row_count % 10000 == 0:
                        print(f"Exported {row_count} rows...")

    print(f"Done. Exported {row_count} rows to {output_path}")


if __name__ == "__main__":
    # 이 파일을 직접 실행했을 때만 export 수행
    main()
