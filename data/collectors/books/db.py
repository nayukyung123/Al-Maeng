import os
from pathlib import Path

import psycopg2
from dotenv import load_dotenv


load_dotenv(Path(__file__).with_name(".env"))

# -----------------------------
# DB 연결
# -----------------------------
def get_db_connection():
    return psycopg2.connect(
        host=os.environ.get("DB_HOST"),
        dbname=os.environ.get("DB_NAME"),
        user=os.environ.get("DB_USER"),
        password=os.environ.get("DB_PASSWORD"),
        port=os.environ.get("DB_PORT"),
    )

# -----------------------------
# DB 삽입
# -----------------------------

# 장르 삽입
def get_or_create_genre(cur, genre_name, parent_id=None):

    cur.execute(
        """
        INSERT INTO genres (genre_name, parent_id)
        VALUES (%s, %s)
        ON CONFLICT (genre_name)
        DO UPDATE SET
            genre_name = EXCLUDED.genre_name,
            parent_id = EXCLUDED.parent_id
        RETURNING id
        """,
        (genre_name, parent_id),
    )

    genre_id = cur.fetchone()[0]

    return genre_id

# 책 삽입
def insert_book(cur, book):

    # books 테이블에 책 데이터 삽입
    cur.execute(
        """
        INSERT INTO books (
            title, author, description, page_count,
            isbn, published_date, cover_image_url, slug
        )
        VALUES (%s,%s,%s,%s,%s,%s,%s,%s)
        ON CONFLICT (isbn) DO NOTHING
        RETURNING id
        """,
        (
            book["title"][:255],        # 제목
            book["author"][:255],             # 저자
            book["description"],        # 설명
            book["page_count"],         # 페이지 수
            book["isbn"],               # ISBN (유니크 키)
            book["published_date"],     # 출판일
            book["cover_image_url"],    # 표지 이미지
            book["slug"][:255]          # slug (URL 식별용)
        )
    )

    # 새로 INSERT된 경우에만 id 반환
    row = cur.fetchone()

    # 이미 존재하는 isbn이면 None 반환
    return row[0] if row else None


# books, genres N:M 관계 중간 테이블
def insert_book_genre(cur, book_id, genre_id):
    try:
        cur.execute(
            """
            INSERT INTO book_genres (book_id, genre_id)
            VALUES (%s,%s)
            ON CONFLICT DO NOTHING
            """,
            (book_id, genre_id),
        )
    except Exception as e:
        print(f"[ERROR] book_genre insert failed: {book_id}, {genre_id}, {e}")
