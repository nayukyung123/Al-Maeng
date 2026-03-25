import os
import requests
import psycopg2
from datetime import datetime
from pathlib import Path
from dotenv import load_dotenv

# [1] 설정 로드
current_file = Path(__file__).resolve()
data_dir = current_file.parent.parent
root_dir = data_dir.parent

if (root_dir / ".env").exists():
    load_dotenv(dotenv_path=root_dir / ".env")
if (data_dir / ".env").exists():
    load_dotenv(dotenv_path=data_dir / ".env", override=True)

# 환경 변수 매핑
TMDB_API_KEY = os.getenv("TMDB_API_KEY")
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "5432")
DB_NAME = os.getenv("DB_NAME")
DB_USER = os.getenv("DB_USERNAME")
DB_PASSWORD = os.getenv("DB_PASSWORD")

def get_db_connection():
    return psycopg2.connect(
        host=DB_HOST, 
        port=DB_PORT, 
        database=DB_NAME, 
        user=DB_USER, 
        password=DB_PASSWORD
    )

def run_tmdb_drama_update():
    """
    TMDB Discover API를 통해 한국 드라마 TOP 3를 수집하여 top_contents에 적재합니다.
    기간: 2026-01-15 ~ 2026-03-15
    조건: 장르 '드라마(18)', 언어 '한국어(ko)', 인기순 정렬
    """
    if not TMDB_API_KEY:
        print("❌ 오류: TMDB_API_KEY가 .env에 설정되지 않았습니다.")
        return

    # 기준 날짜 설정
    start_date = "2026-01-15"
    end_date = "2026-03-15"
    
    print(f"📡 TMDB 드라마 데이터를 가져오는 중... ({start_date} ~ {end_date})")
    
    url = "https://api.themoviedb.org/3/discover/tv"
    params = {
        'api_key': TMDB_API_KEY,
        'language': 'ko-KR',
        'sort_by': 'popularity.desc',
        'first_air_date.gte': start_date,
        'first_air_date.lte': end_date,
        'with_genres': '18',           # 드라마 장르 ID
        'with_original_language': 'ko',
        'page': 1
    }
    
    try:
        response = requests.get(url, params=params, timeout=10)
        response.raise_for_status()
        # 상위 3개 추출
        drama_list = response.json().get('results', [])[:3]
    except Exception as e:
        print(f"❌ TMDB API 호출 실패: {e}")
        return

    if not drama_list:
        print("⚠️ 조건에 맞는 드라마 데이터가 없습니다.")
        return

    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            # 1. 기존 드라마 인기 데이터 삭제 (Overwrite - TV 타입만 삭제)
            # 영화(MOVIE) 데이터는 유지하기 위해 WHERE 조건을 사용합니다.
            print("🗑️ 기존 top_contents 내 드라마(TV) 데이터를 초기화합니다.")
            cur.execute("DELETE FROM top_contents WHERE type = 'TV';")
            
            # 2. 새로운 데이터 삽입 (제목 + 타입 기반 매핑)
            # tmdb_id 중복 문제를 방지하기 위해 WHERE 조건에 type='TV'를 명시합니다.
            insert_query = """
                INSERT INTO top_contents (content_id, rank, type, updated_at)
                SELECT id, %s, 'TV', NOW()
                FROM contents
                WHERE title = %s AND type = 'TV'
                LIMIT 1;
            """
            
            success_count = 0
            print(f"📥 드라마 인기 순위 TOP 3 적재 시작...")
            for idx, item in enumerate(drama_list, start=1):
                rank = idx
                drama_nm = item.get('name') # TV는 title 대신 name 필드 사용
                
                cur.execute(insert_query, (rank, drama_nm))
                
                if cur.rowcount > 0:
                    print(f"   [Rank {rank}] ✅ {drama_nm} 매핑 및 적재 완료")
                    success_count += 1
                else:
                    print(f"   [Rank {rank}] ⚠️ 매핑 실패: {drama_nm} (DB contents 테이블에 해당 TV 데이터가 없습니다.)")
            
            conn.commit()
            print(f"\n✨ 작업 완료! 총 {success_count}개의 드라마 데이터가 top_contents에 저장되었습니다.")
            
    except Exception as e:
        conn.rollback()
        print(f"❌ DB 작업 중 오류 발생: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    run_tmdb_drama_update()