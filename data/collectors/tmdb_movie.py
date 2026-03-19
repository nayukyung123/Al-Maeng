import os
import json
import time
import re
import psycopg2
from psycopg2.extras import execute_values
import requests
from datetime import datetime, timedelta
from pathlib import Path
from dotenv import load_dotenv
from concurrent.futures import ThreadPoolExecutor, as_completed

# [1] 설정 로드: 드라마 코드와 동일하게 경로를 명시적으로 지정하여 두 .env 파일을 모두 읽습니다.
current_file = Path(__file__).resolve()
data_dir = current_file.parent.parent        # /data/ 폴더
root_dir = data_dir.parent                   # / (프로젝트 루트) 폴더

# 1) 루트 .env 읽기 (DB 정보 등 공통 세팅)
if (root_dir / ".env").exists():
    load_dotenv(dotenv_path=root_dir / ".env")

# 2) data/.env 읽기 (이미 로드된 환경변수는 덮어쓰지 않음, 필요 시 override=True 사용 가능)
if (data_dir / ".env").exists():
    load_dotenv(dotenv_path=data_dir / ".env", override=True)

# [2] 환경 변수 매핑 (드라마 코드와 변수명 및 기본값 동기화)
API_KEY = os.getenv("TMDB_API_KEY")
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "5432") # 주연님 로그상 5432 접속이므로 기본값 수정
DB_NAME = os.getenv("DB_NAME")
DB_USER = os.getenv("DB_USERNAME")    # DB_USER -> DB_USERNAME으로 매핑
DB_PASSWORD = os.getenv("DB_PASSWORD")

# 영화 장르 마스터 맵
GENRE_MAP = {
    28: "액션", 12: "모험", 16: "애니메이션", 35: "코미디", 80: "범죄", 
    99: "다큐멘터리", 18: "드라마", 10751: "가족", 14: "판타지", 36: "역사", 
    27: "공포", 10402: "음악", 9648: "미스터리", 10749: "로맨스", 878: "SF", 
    10770: "TV 영화", 53: "스릴러", 10752: "전쟁", 37: "서부"
}

def get_db_connection():
    """드라마 코드의 방식대로 구현된 DB 연결 함수"""
    if not all([DB_NAME, DB_USER, DB_PASSWORD]):
        raise ValueError(f"DB 설정 정보가 부족합니다. (USER: {DB_USER}, NAME: {DB_NAME})")
    
    return psycopg2.connect(
        host=DB_HOST, 
        port=DB_PORT, 
        database=DB_NAME, 
        user=DB_USER, 
        password=DB_PASSWORD
    )

def is_strictly_clean_title(title):
    """드라마 코드와 동일한 한/영/숫자/기호 클린 필터링"""
    pattern = r"^[가-힣a-zA-Z0-9\s\.,!\?\"\'\(\)\[\]\:\-\&\/\~\+\*\#]+$"
    return bool(re.fullmatch(pattern, title))

def get_movie_detail_optimized(movie_id, list_overview):
    """
    주연님 요청 로직 (드라마 코드와 로직 동기화):
    1. 목록 줄거리 <= 5자: 상세 API 호출 (append_to_response=keywords,translations)
    2. 목록 줄거리 > 5자: 키워드 API만 별도 호출
    """
    description = list_overview.strip() if list_overview else ""
    keywords_list = []

    try:
        # [Case 1] 줄거리가 부실한 경우 -> 상세 정보(번역본 포함)와 키워드 통합 요청
        if len(description) <= 5:
            res = requests.get(
                f"https://api.themoviedb.org/3/movie/{movie_id}", 
                params={
                    'api_key': API_KEY, 
                    'language': 'ko-KR', 
                    'append_to_response': 'keywords,translations'
                }, timeout=5 # 병렬 처리를 위해 타임아웃 최적화
            ).json()
            
            # 영화 상세 응답에서 키워드 추출 (구조: keywords.keywords)
            keywords_list = [k['name'] for k in res.get('keywords', {}).get('keywords', [])]
            description = res.get('overview', '').strip()
            
            # 여전히 부실하면 드라마 코드처럼 translations에서 영어(en) 추출
            if len(description) <= 5:
                translations = res.get('translations', {}).get('translations', [])
                en_trans = next((t for t in translations if t['iso_639_1'] == 'en'), None)
                if en_trans:
                    description = en_trans['data'].get('overview', '').strip()

        # [Case 2] 목록 줄거리가 충분한 경우 -> 키워드 API만 호출
        else:
            kw_res = requests.get(
                f"https://api.themoviedb.org/3/movie/{movie_id}/keywords", 
                params={'api_key': API_KEY}, timeout=5
            ).json()
            keywords_list = [k['name'] for k in kw_res.get('keywords', [])]

    except: pass

    return description if description else None, keywords_list

def process_movie(m, year):
    """개별 가공 및 튜플 반환 (release_date 필드 추가 반영)"""
    title = m.get('title', '')
    if not is_strictly_clean_title(title): return None
    
    # [1] 개봉 연월일 데이터 처리
    release_date = m.get('release_date')
    if not release_date: release_date = None

    # [2] 주연님 필터: 2025년 이전 평점 1개 이상 필수, 2026년 무조건 허용
    vote_count = m.get('vote_count', 0)
    if year <= 2025 and vote_count < 1:
        return None
    
    description, keywords = get_movie_detail_optimized(m['id'], m.get('overview', ''))
    genre_names = [GENRE_MAP.get(gid) for gid in m.get('genre_ids', []) if GENRE_MAP.get(gid)]
    
    # ERD 필드 매핑 순서: tmdb_id, title, type, description, poster_url, banner_poster_url, keywords, vote_count, genres, release_date
    return (
        m['id'],                                      # tmdb_id
        title,                                        # title
        'MOVIE',                                      # type
        description,                                  # description
        f"https://image.tmdb.org/t/p/w500{m.get('poster_path')}" if m.get('poster_path') else None, 
        f"https://image.tmdb.org/t/p/original{m.get('backdrop_path')}" if m.get('backdrop_path') else None,
        json.dumps(keywords, ensure_ascii=False),     # keywords (JSONB)
        vote_count,                                   # vote_count (BIGINT)
        json.dumps(genre_names, ensure_ascii=False),  # genres (JSONB)
        release_date                                  # release_date (DATE)
    )

def main():
    if not API_KEY: 
        print("❌ 오류: TMDB_API_KEY가 없습니다.")
        return
    
    try:
        conn = get_db_connection()
        print(f"📡 DB 접속 성공 ({DB_HOST}:{DB_PORT})")
        
        # [수집 계획 역순 재배치] 최신 연도 구간부터 과거로 진행
        fetch_plans = [
            (2020, 2026, 1), 
            (2019, 2019, 3), 
            (2010, 2018, 3), 
            (1990, 2009, 6), 
            (1950, 1989, 12)
        ]
        today_limit = datetime(2026, 3, 20)
        total_saved = 0

        # [병렬 가속화] 주연님 요청대로 Workers 수를 20으로 상향
        print(f"🚀 영화 데이터 적재 시작 (Latest First | Workers: 20)")
        print("-" * 85)

        with ThreadPoolExecutor(max_workers=20) as executor:
            for start_y, end_y, interval in fetch_plans:
                # 연도 역순 반복
                for year in reversed(range(start_y, end_y + 1)):
                    # 월 역순 반복
                    for month in reversed(range(1, 13, interval)):
                        actual_interval = 1 if (year == 2019 and month >= 10) else interval
                        s_dt = datetime(year, month, 1)
                        if s_dt > today_limit: continue
                        
                        e_dt = (datetime(year + (month + actual_interval - 1) // 12, (month + actual_interval - 1) % 12 + 1, 1) - timedelta(days=1))
                        if e_dt > today_limit: e_dt = today_limit
                        
                        s_str, e_str = s_dt.strftime('%Y-%m-%d'), e_dt.strftime('%Y-%m-%d')
                        
                        page = 1
                        while page <= 500:
                            params = {
                                'api_key': API_KEY, 
                                'language': 'ko-KR', 
                                'page': page,
                                'primary_release_date.gte': s_str, 
                                'primary_release_date.lte': e_str,
                                'sort_by': 'primary_release_date.desc' # API 내부 정렬도 최신순으로
                            }
                            try:
                                resp = requests.get("https://api.themoviedb.org/3/discover/movie", params=params, timeout=10).json()
                                movies = resp.get('results', [])
                                total_pages = resp.get('total_pages', 0)
                                if not movies: break
                            except: break

                            futures = [executor.submit(process_movie, m, year) for m in movies]
                            batch = [f.result() for f in as_completed(futures) if f.result() is not None]

                            if batch:
                                # [ERD 기준 필드명 동기화 및 release_date 추가]
                                query = """
                                    INSERT INTO contents (
                                        tmdb_id, title, type, description, poster_url, 
                                        banner_poster_url, keywords, vote_count, genres, release_date
                                    ) VALUES %s
                                    ON CONFLICT (tmdb_id) DO UPDATE SET
                                    release_date = EXCLUDED.release_date,
                                    description = COALESCE(NULLIF(EXCLUDED.description, ''), contents.description),
                                    vote_count = EXCLUDED.vote_count,
                                    genres = EXCLUDED.genres,
                                    keywords = EXCLUDED.keywords;
                                """
                                with conn.cursor() as cur:
                                    execute_values(cur, query, batch)
                                conn.commit()
                                total_saved += len(batch)
                                print(f"\r[*] {year}년 {month:02d}월 | {page}/{total_pages}p | 누적: {total_saved:,}개", end='', flush=True)

                            if page >= total_pages: break
                            page += 1
                    print(f"\n   ✅ {year}년 수집 완료")

        conn.close()
        print(f"\n🎉 모든 수집 종료! 총 {total_saved:,}개의 영화 데이터가 최신순으로 적재되었습니다.")
        
    except Exception as e:
        print(f"\n❌ 오류 발생: {e}")

if __name__ == "__main__":
    main()