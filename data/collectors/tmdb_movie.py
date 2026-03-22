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

# HTTP 세션 설정 (연결 재사용 및 커넥션 풀 확장)
session = requests.Session()
adapter = requests.adapters.HTTPAdapter(pool_connections=20, pool_maxsize=20)
session.mount('https://', adapter)

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

def has_korean(text):
    """제목 내 한글 포함 여부 확인"""
    if not text: return False
    return bool(re.search(r'[가-힣]', text))

def has_valid_language(text):
    """줄거리 내 한글/영어 포함 여부 확인 (기타 언어 단독 사용 배제)"""
    if not text: return False
    return bool(re.search(r'[가-힣a-zA-Z]', text))

def get_movie_detail_optimized(movie_id, title=""):
    """
    movie: release_date 때문에 반드시 details api 호출
    append_to_response=translations,keywords,release_dates
    """
    description = ""
    keywords_list = []
    release_date = None

    try:
        res = session.get(
            f"https://api.themoviedb.org/3/movie/{movie_id}", 
            params={
                'api_key': API_KEY, 
                'language': 'ko-KR', 
                'append_to_response': 'keywords,translations,release_dates'
            }, timeout=10
        ).json()
        
        keywords_list = [k['name'] for k in res.get('keywords', {}).get('keywords', [])]
        description = res.get('overview', '').strip()
        
        # 한국어 부재 (5자 이하 부실) 이거나 제목과 줄거리가 단어 하나 안 틀리고 같을 시 영문 줄거리 호출
        if len(description) <= 5 or description == title.strip():
            translations = res.get('translations', {}).get('translations', [])
            en_trans = next((t for t in translations if t['iso_639_1'] == 'en'), None)
            if en_trans:
                description = en_trans['data'].get('overview', '').strip()

        # release_dates를 사용하여 한국 기준 개봉일 탐색
        release_dates_results = res.get('release_dates', {}).get('results', [])
        kr_release = next((r for r in release_dates_results if r['iso_3166_1'] == 'KR'), None)
        
        if kr_release and kr_release.get('release_dates'):
            date_str = kr_release['release_dates'][0].get('release_date', '')
            if date_str:
                release_date = date_str.split('T')[0]
                
        # 한국 개봉일 못 찾으면 기본값 사용
        if not release_date:
            release_date = res.get('release_date')
            if not release_date:
                release_date = None

    except: pass

    return description if description else None, keywords_list, release_date

def process_movie(m, year):
    """개별 가공 및 튜플 반환 (release_date 필드 추가 반영)"""
    title = m.get('title', '')
    if not has_korean(title): return None
    
    # 2. 1950년 ~ 2025년 : vote_count >= 1
    vote_count = m.get('vote_count', 0)
    if year <= 2025 and vote_count < 1:
        return None
    
    description, keywords, release_date = get_movie_detail_optimized(m['id'], title)
    
    # 3. 미래 데이터(개봉 예정작) 필터링: 기준일(2026-03-31) 이후 개봉작은 버림
    if release_date and release_date > "2026-03-31":
        return None
        
    if len(description or "") <= 5 or not has_valid_language(description):
        return None

    genre_names = [GENRE_MAP.get(gid) for gid in m.get('genre_ids', []) if GENRE_MAP.get(gid)]
    
    # 5. 제목과 줄거리가 같고 키워드와 장르가 모두 없는 경우 적재 제외
    if title.strip() == (description or "").strip() and not keywords and not genre_names:
        return None

    # 반환 튜플 (SQL 쿼리 순서에 맞춤)
    return (
        m['id'],                                      # tmdb_id
        title,                                        # title
        'MOVIE',                                      # type
        description,                                  # description
        f"https://image.tmdb.org/t/p/w500{m.get('poster_path')}" if m.get('poster_path') else None, 
        f"https://image.tmdb.org/t/p/original{m.get('backdrop_path')}" if m.get('backdrop_path') else None,
        json.dumps(keywords, ensure_ascii=False),     # keywords
        vote_count,                                   # vote_count
        json.dumps(genre_names, ensure_ascii=False),  # genres
        release_date,                                 # release_date
        'READY'                                       # tag_status (기본값)
    )

def main():
    if not API_KEY: 
        print("❌ 오류: TMDB_API_KEY가 없습니다.")
        return
    
    try:
        conn = get_db_connection()
        print(f"📡 DB 접속 성공 ({DB_HOST}:{DB_PORT})")
        
        # 수집 계획
        fetch_plans = [(1950, 1989, 12), (1990, 2009, 6), (2010, 2018, 3), (2019, 2019, 3), (2020, 2026, 1)]
        today_limit = datetime(2026, 3, 31)
        total_saved = 0

        print(f"🚀 영화 데이터 적재 시작 (Workers: 20) | 대상: ~2026-03-31")
        print("-" * 85)

        # 1) 기간 목록 생성 후 역순 정렬 (최신 날짜부터 수집)
        periods = []
        for start_y, end_y, interval in fetch_plans:
            for year in range(start_y, end_y + 1):
                for month in range(1, 13, interval):
                    actual_interval = 1 if (year == 2019 and month >= 10) else interval
                    s_dt = datetime(year, month, 1)
                    if s_dt > today_limit: continue
                    
                    e_dt = (datetime(year + (month + actual_interval - 1) // 12, (month + actual_interval - 1) % 12 + 1, 1) - timedelta(days=1))
                    if e_dt > today_limit: e_dt = today_limit
                    
                    periods.append((year, month, s_dt.strftime('%Y-%m-%d'), e_dt.strftime('%Y-%m-%d')))
        
        periods.reverse() # 최신순으로 정렬

        with ThreadPoolExecutor(max_workers=20) as executor:
            current_year = None
            
            for year, month, s_str, e_str in periods:
                if current_year is not None and current_year != year:
                    print(f"\n   ✅ {current_year}년 수집 완료")
                current_year = year
                
                page = 1
                while page <= 500:
                    params = {
                        'api_key': API_KEY, 
                        'language': 'ko-KR', 
                        'page': page,
                        'primary_release_date.gte': s_str, 
                        'primary_release_date.lte': e_str,
                        'sort_by': 'primary_release_date.desc' # 해당 기간 내 최신순 페이지
                    }
                    try:
                        resp = session.get("https://api.themoviedb.org/3/discover/movie", params=params, timeout=10).json()
                        movies = resp.get('results', [])
                        total_pages = resp.get('total_pages', 0)
                        if not movies: break
                    except: break

                    # 병렬 처리로 상세 정보 보강
                    futures = [executor.submit(process_movie, m, year) for m in movies]
                    batch = [f.result() for f in as_completed(futures) if f.result() is not None]

                    if batch:
                        # 4. tmdb_id가 중복인 경우 update 규칙 적용
                        query = """
                            INSERT INTO contents (
                                tmdb_id, title, type, description, poster_url, 
                                banner_poster_url, keywords, vote_count, genres, release_date, tag_status
                            ) VALUES %s
                            ON CONFLICT (tmdb_id, type) DO UPDATE SET
                                title = EXCLUDED.title,
                                poster_url = COALESCE(EXCLUDED.poster_url, contents.poster_url),
                                banner_poster_url = COALESCE(EXCLUDED.banner_poster_url, contents.banner_poster_url),
                                release_date = COALESCE(EXCLUDED.release_date, contents.release_date),
                                
                                -- 1. 줄거리: 글자 수가 더 긴 쪽 선택
                                description = CASE 
                                    WHEN LENGTH(COALESCE(EXCLUDED.description, '')) > LENGTH(COALESCE(contents.description, '')) 
                                    THEN EXCLUDED.description 
                                    ELSE contents.description 
                                END,

                                -- 2. 키워드: 배열의 원소 개수가 더 많은 쪽 선택
                                keywords = CASE 
                                    WHEN jsonb_array_length(COALESCE(EXCLUDED.keywords, '[]'::jsonb)) > jsonb_array_length(COALESCE(contents.keywords, '[]'::jsonb))
                                    THEN EXCLUDED.keywords 
                                    ELSE contents.keywords 
                                END,

                                -- 3. 장르: 배열의 원소 개수가 더 많은 쪽 선택
                                genres = CASE 
                                    WHEN jsonb_array_length(COALESCE(EXCLUDED.genres, '[]'::jsonb)) > jsonb_array_length(COALESCE(contents.genres, '[]'::jsonb))
                                    THEN EXCLUDED.genres 
                                    ELSE contents.genres 
                                END,

                                -- 4. 기타 정보: 최신 수치나 유효한 값으로 보충
                                vote_count = GREATEST(EXCLUDED.vote_count, contents.vote_count);
                        """
                        with conn.cursor() as cur:
                            execute_values(cur, query, batch)
                        conn.commit()
                        total_saved += len(batch)
                        print(f"\r[*] {year}년 {month:02d}월 | {page}/{total_pages}p | 누적: {total_saved:,}개", end='', flush=True)

                        # API 속도 제한 준수용 지연
                        time.sleep(0.05)

                    if page >= total_pages: break
                    page += 1
                    
            if current_year is not None:
                print(f"\n   ✅ {current_year}년 수집 완료")

        conn.close()
        print(f"\n🎉 모든 수집 종료! 총 {total_saved:,}개의 영화 데이터가 최신순으로 적재되었습니다.")
        
    except Exception as e:
        print(f"\n❌ 오류 발생: {e}")

if __name__ == "__main__":
    main()