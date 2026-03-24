#!/usr/bin/env python3
import os
import psycopg2
import io
import csv
import ast
import json
from dotenv import load_dotenv
from pathlib import Path

# [1] 설정 로드
current_file = Path(__file__).resolve()
current_dir = current_file.parent
data_dir = current_dir.parent.parent
root_dir = data_dir.parent

load_dotenv(dotenv_path=root_dir / ".env")
load_dotenv(dotenv_path=data_dir / ".env", override=True)

DB_CONFIG = {
    'host': os.getenv("DB_HOST", "127.0.0.1"),
    'port': os.getenv("DB_PORT", "5433"),
    'database': os.getenv("DB_NAME", "almaeng"),
    'user': os.getenv("DB_USERNAME", "almaeng"),
    'password': os.getenv("DB_PASSWORD", "almaeng")
}

def get_conn():
    try:
        return psycopg2.connect(**DB_CONFIG, connect_timeout=3)
    except Exception as e:
        print(f"\n❌ DB 연결 실패: {e}")
        return None

def import_contents_to_local():
    """영화/TV 데이터 주입 (contents_for_tagging.tsv)"""
    conn = get_conn()
    if not conn: return
    cur = conn.cursor()
    file_path = current_dir / "contents_for_tagging.tsv"
    
    if not file_path.exists():
        print(f"❌ 파일을 찾을 수 없습니다: {file_path}")
        return

    print(f"📥 {file_path.name} 데이터 정제 및 contents 테이블 주입 중...")
    try:
        cur.execute("ALTER TABLE contents ALTER COLUMN tmdb_id DROP NOT NULL;")
        cur.execute("ALTER TABLE contents ALTER COLUMN type DROP NOT NULL;")
        cur.execute("TRUNCATE TABLE tags CASCADE;")
        cur.execute("DELETE FROM contents;")
        
        output = io.StringIO()
        with open(file_path, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f, delimiter='\t')
            writer = csv.DictWriter(output, fieldnames=reader.fieldnames, delimiter='\t', quoting=csv.QUOTE_MINIMAL)
            writer.writeheader()
            for row in reader:
                for col in ['genres', 'keywords']:
                    val = (row[col] or "").strip()
                    if val.startswith('[') and val.endswith(']'):
                        try:
                            parsed_list = ast.literal_eval(val)
                            row[col] = json.dumps(parsed_list, ensure_ascii=False)
                        except: pass
                writer.writerow(row)
        output.seek(0)
        cur.copy_expert("COPY contents (id, title, description, genres, keywords) FROM STDIN WITH (FORMAT CSV, DELIMITER E'\t', HEADER)", output)
        cur.execute("UPDATE contents SET tag_status = 'READY' WHERE tag_status IS NULL;")
        conn.commit()
        print(f"✅ 콘텐츠 주입 완료!")
    except Exception as e:
        conn.rollback()
        print(f"❌ 실패: {e}")
    finally:
        cur.close()
        conn.close()

def import_books_to_local():
    """로컬 DB에 books 테이블 생성 및 데이터 주입 (books_data.tsv)"""
    conn = get_conn()
    if not conn: return
    cur = conn.cursor()
    file_path = current_dir / "books_data.tsv"
    
    if not file_path.exists():
        print(f"❌ 파일을 찾을 수 없습니다: {file_path}")
        return

    print(f"🏗️ 로컬 DB 스키마 생성 및 {file_path.name} 주입 시작...")
    try:
        # 1. pgvector 확장 활성화
        cur.execute("CREATE EXTENSION IF NOT EXISTS vector;")
        
        # 2. books 테이블 생성 (EC2와 동일한 구조)
        cur.execute("""
            CREATE TABLE IF NOT EXISTS books (
                id BIGINT PRIMARY KEY,
                title VARCHAR(255),
                author VARCHAR(255),
                description TEXT,
                page_count INTEGER,
                isbn VARCHAR(20),
                published_date DATE,
                cover_image_url TEXT,
                average_rating NUMERIC(2,1),
                created_at TIMESTAMP,
                embedding_vector vector(1024),
                slug VARCHAR(255)
            );
        """)
        
        # 3. 기존 데이터 초기화
        cur.execute("TRUNCATE TABLE books CASCADE;")
        
        # 4. COPY 명령어 실행
        with open(file_path, 'r', encoding='utf-8') as f:
            cur.copy_expert("""
                COPY books (
                    id, title, author, description, page_count, isbn, 
                    published_date, cover_image_url, average_rating, 
                    created_at, embedding_vector, slug
                ) FROM STDIN WITH (FORMAT CSV, DELIMITER E'\t', HEADER)
            """, f)
            
        conn.commit()
        print(f"✅ 도서 테이블 생성 및 데이터 주입 완료!")
    except Exception as e:
        conn.rollback()
        print(f"❌ 도서 주입 실패: {e}")
    finally:
        cur.close()
        conn.close()

def export_tags_from_local():
    """로컬 tags 테이블의 결과를 tsv로 추출 (EC2 전송용)"""
    conn = get_conn()
    if not conn: return
    cur = conn.cursor()
    output_file = current_dir / "tags_to_import.tsv"
    print(f"📤 데이터를 {output_file.name}로 추출 중...")
    try:
        with open(output_file, 'w', encoding='utf-8') as f:
            cur.copy_expert("COPY (SELECT content_id, tag_name, embedding_vector FROM tags) TO STDIN WITH (FORMAT CSV, DELIMITER E'\t')", f)
        print(f"✅ 추출 완료!")
    except Exception as e:
        print(f"❌ 추출 실패: {e}")
    finally:
        cur.close()
        conn.close()

if __name__ == "__main__":
    print(f"\n--- 🛠️ 알맹 로컬 DB 헬퍼 (초기화 및 통합 관리) ---")
    print("1. [Import Contents] contents_for_tagging.tsv -> contents")
    print("2. [Export Tags] 로컬 가공 결과 -> tags_to_import.tsv")
    print("3. [Import Books] books_data.tsv -> books (테이블 생성 포함)")
    print("--------------------------------------------------")
    choice = input("작업 번호를 선택하세요 (1/2/3): ").strip()
    
    if choice == '1': import_contents_to_local()
    elif choice == '2': export_tags_from_local()
    elif choice == '3': import_books_to_local()