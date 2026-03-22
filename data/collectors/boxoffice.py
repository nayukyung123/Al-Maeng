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
KOFIC_API_KEY = os.getenv("KOFIC_API_KEY") # 영진위 API 키
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "5432")
DB_NAME = os.getenv("DB_NAME")
DB_USER = os.getenv("DB_USERNAME")
DB_PASSWORD = os.getenv("DB_PASSWORD")

def get_db_connection():
    """데이터베이스 연결 설정"""
    return psycopg2.connect(
        host=DB_HOST, 
        port=DB_PORT, 
        database=DB_NAME, 
        user=DB_USER, 
        password=DB_PASSWORD
    )

def run_kofic_manual_update():
    """
    KOFIC(영진위) 주간 박스오피스 API를 호출하여 top_contents 테이블을 갱신합니다.
    대상 기간: 2026-03-09 (월) ~ 2026-03-15 (일)
    수정 사항: TOP 3위까지만 제한하여 적재
    """
    if not KOFIC_API_KEY:
        print("❌ 오류: KOFIC_API_KEY가 .env에 설정되지 않았습니다.")
        return

    # 2026년 3월 2주차의 일요일인 2026-03-15를 기준으로 조회
    target_dt = "20260315"
    print(f"📡 KOFIC 주간 박스오피스 데이터를 가져오는 중... (기준일: {target_dt})")
    
    url = "http://www.kobis.or.kr/kobisopenapi/webservice/rest/boxoffice/searchWeeklyBoxOfficeList.json"
    params = {
        'key': KOFIC_API_KEY,
        'targetDt': target_dt,
        'weekGb': '0' # 0: 주간 (월~일)
    }
    
    try:
        response = requests.get(url, params=params, timeout=10)
        response.raise_for_status()
        # 영진위 응답 구조에서 전체 리스트를 가져온 후 상위 3개만 슬라이싱
        full_list = response.json().get('boxOfficeResult', {}).get('weeklyBoxOfficeList', [])
        box_office_list = full_list[:3] # TOP 3 제한
    except Exception as e:
        print(f"❌ KOFIC API 호출 실패: {e}")
        return

    if not box_office_list:
        print(f"⚠️ 해당 날짜({target_dt})의 박스오피스 데이터가 존재하지 않습니다.")
        return

    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            # 1. 기존 인기 콘텐츠 데이터 삭제 (Overwrite)
            print("🗑️ 기존 top_contents 데이터를 초기화합니다.")
            cur.execute("DELETE FROM top_contents;")
            
            # 2. 새로운 데이터 삽입 (영화 제목 기반 매핑)
            insert_query = """
                INSERT INTO top_contents (content_id, rank, type, updated_at)
                SELECT id, %s, 'MOVIE', NOW()
                FROM contents
                WHERE title = %s
                LIMIT 1;
            """
            
            success_count = 0
            print(f"📥 2026년 3월 2주차 주간 TOP 3 적재 시작...")
            for item in box_office_list:
                rank = item['rank']      # 순위
                movie_nm = item['movieNm'] # 영화명
                
                # DB의 contents 테이블에서 제목으로 매핑하여 삽입 시도
                cur.execute(insert_query, (rank, movie_nm))
                
                if cur.rowcount > 0:
                    print(f"   [Rank {rank}] ✅ {movie_nm} 매핑 및 적재 완료")
                    success_count += 1
                else:
                    print(f"   [Rank {rank}] ⚠️ 매핑 실패: {movie_nm} (DB에 해당 제목의 영화가 없습니다.)")
            
            conn.commit()
            print(f"\n✨ 작업 완료! 총 {success_count}개의 데이터가 top_contents(TOP 3)에 저장되었습니다.")
            
    except Exception as e:
        conn.rollback()
        print(f"❌ DB 작업 중 오류 발생: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    run_kofic_manual_update()