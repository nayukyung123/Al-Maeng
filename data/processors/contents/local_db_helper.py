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
    """TSV 파일을 읽어 JSON 보정 후 제약 조건을 완화하여 로컬 DB에 주입"""
    conn = get_conn()
    if not conn: return
    cur = conn.cursor()
    
    file_path = current_dir / "contents_for_tagging.tsv"
    if not file_path.exists():
        print(f"❌ 파일을 찾을 수 없습니다: {file_path}")
        return

    print(f"📥 {file_path.name} 데이터 정제 및 제약 조건 조정 중...")
    
    try:
        # 1. 로컬 DB 제약 조건 일시 완화 (tmdb_id, type 등 필수값 제외 처리)
        # 로컬은 가공 전용이므로 NULL을 허용하도록 변경합니다.
        cur.execute("ALTER TABLE contents ALTER COLUMN tmdb_id DROP NOT NULL;")
        cur.execute("ALTER TABLE contents ALTER COLUMN type DROP NOT NULL;")
        
        # 2. 기존 데이터 초기화
        cur.execute("TRUNCATE TABLE tags CASCADE;")
        cur.execute("DELETE FROM contents;")
        
        # 3. TSV 파일을 읽어 JSON 컬럼 보정
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
                        except (ValueError, SyntaxError):
                            pass
                writer.writerow(row)
        
        output.seek(0)
        
        # 4. COPY 명령 실행 (명시된 컬럼만 주입)
        cur.copy_expert("""
            COPY contents (id, title, description, genres, keywords) 
            FROM STDIN WITH (FORMAT CSV, DELIMITER E'\t', HEADER)
        """, output)
        
        # 5. 후처리: 상태 업데이트 및 타입 기본값 지정 (선택 사항)
        cur.execute("UPDATE contents SET tag_status = 'READY' WHERE tag_status IS NULL;")
        
        conn.commit()
        print(f"✅ 주입 완료! 이제 main.py를 실행하세요.")
        
    except Exception as e:
        conn.rollback()
        print(f"❌ 주입 실패: {e}")
        print("💡 팁: 만약 'tmdb_id' 외에 다른 컬럼에서 오류가 난다면 해당 컬럼도 DROP NOT NULL 처리가 필요할 수 있습니다.")
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
            cur.copy_expert("""
                COPY (SELECT content_id, tag_name, embedding_vector FROM tags) 
                TO STDIN WITH (FORMAT CSV, DELIMITER E'\t')
            """, f)
        print(f"✅ 추출 완료!")
    except Exception as e:
        print(f"❌ 추출 실패: {e}")
    finally:
        cur.close()
        conn.close()

if __name__ == "__main__":
    print(f"\n--- 🛠️ 알맹 로컬 DB 헬퍼 (제약 조건 완화 모드) ---")
    print("1. [Import] TSV 원본 -> 로컬 DB 주입")
    print("2. [Export] 로컬 DB 결과 -> TSV 추출")
    print("--------------------------------------------------")
    choice = input("작업 번호를 선택하세요 (1/2): ").strip()
    if choice == '1': import_contents_to_local()
    elif choice == '2': export_tags_from_local()