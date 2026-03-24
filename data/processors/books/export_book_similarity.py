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
    # similarity_score는 숫자 하나이지만,
    # 전체 형식을 embedding export와 맞추기 위해 TSV를 사용한다.
    output_path = Path(__file__).with_name("book_similarity.tsv")

    query = """
        SELECT
            book_id,
            similar_book_id,
            similarity_score
        FROM book_similarity
        ORDER BY book_id, similar_book_id
    """

    print(f"Exporting book_similarity to {output_path}...")

    row_count = 0

    with get_db_connection() as conn:
        # 서버사이드 커서를 사용해 전체 데이터를 한 번에 메모리에 올리지 않고
        # 일정량씩 읽어서 TSV로 스트리밍 저장한다.
        with conn.cursor(name="book_similarity_export") as cur:
            cur.itersize = 5000
            cur.execute(query)

            with output_path.open("w", encoding="utf-8", newline="") as f:
                writer = csv.writer(
                    f,
                    delimiter="\t",
                    quoting=csv.QUOTE_MINIMAL,
                )

                # EC2 import 스크립트에서 그대로 읽을 헤더
                writer.writerow(["book_id", "similar_book_id", "similarity_score"])

                for book_id, similar_book_id, similarity_score in cur:
                    writer.writerow([book_id, similar_book_id, float(similarity_score)])
                    row_count += 1

                    if row_count % 10000 == 0:
                        print(f"Exported {row_count} rows...")

    print(f"Done. Exported {row_count} rows to {output_path}")


if __name__ == "__main__":
    # 이 파일을 직접 실행했을 때만 export 수행
    main()