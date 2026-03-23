#!/usr/bin/env python3
import os
import json
import time
import re
import psycopg2
import requests
from pathlib import Path
from dotenv import load_dotenv
from concurrent.futures import ThreadPoolExecutor, as_completed
from psycopg2.extras import execute_values

# [1] 설정 로드: 친구가 알려준 방식대로 경로를 명시적으로 지정하여 두 .env 파일을 모두 읽습니다.
current_file = Path(__file__).resolve()  # 현재 파일 위치 (data/collectors/tmdb_tv.py)
data_dir = current_file.parent.parent    # data 폴더 (TMDB_API_KEY 위치)
root_dir = data_dir.parent               # 루트 폴더 (DB 정보 위치)

# 1) 루트 .env 읽기 (DB 정보 등 공통 세팅)
if (root_dir / ".env").exists():
    load_dotenv(dotenv_path=root_dir / ".env")
    print(f"✅ 루트 .env 로드 완료: {root_dir / '.env'}")

# 2) data/.env 읽기 (이미 로드된 환경변수는 덮어쓰지 않음, 필요 시 override=True 사용 가능)
if (data_dir / ".env").exists():
    load_dotenv(dotenv_path=data_dir / ".env")
    print(f"✅ 데이터 .env 로드 완료: {data_dir / '.env'}")

# [2] 환경 변수 매핑 (친구의 가이드에 따라 변수명과 기본값 설정)
API_KEY = os.getenv("TMDB_API_KEY")
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "5433") # 로컬 기본값 5433
DB_NAME = os.getenv("DB_NAME")
DB_USER = os.getenv("DB_USERNAME")     # DB_USER -> DB_USERNAME으로 매핑
DB_PASSWORD = os.getenv("DB_PASSWORD")

print(f"🔍 접속 정보 확인 -> Host: {DB_HOST}, Port: {DB_PORT}, DB: {DB_NAME}")

# TV 장르 마스터 맵
GENRE_MAP = {
    10759: "액션 및 어드벤처", 16: "애니메이션", 35: "코미디", 80: "범죄", 
    99: "다큐멘터리", 18: "드라마", 10751: "가족", 10762: "키즈", 
    9648: "미스터리", 10763: "뉴스", 10764: "리얼리티", 10765: "SF 및 판타지", 
    10766: "연속극", 10767: "토크", 10768: "전쟁 및 정치", 37: "서부"
}

# 수집 구간 설정 (2026년 3월 20일까지)
date_ranges = [
    ("1950-01-01", "1989-12-31"), ("1990-01-01", "1999-12-31"),
    ("2000-01-01", "2007-12-31"), ("2008-01-01", "2011-12-31"),
    ("2012-01-01", "2014-12-31"), ("2015-01-01", "2017-12-31"),
    ("2018-01-01", "2019-12-31"), ("2020-01-01", "2021-12-31"),
    ("2022-01-01", "2023-12-31"), ("2024-01-01", "2025-12-31"),
    ("2026-01-01", "2026-03-20")
]

def get_db_connection():
    """친구의 방식대로 구현된 DB 연결 함수"""
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
    pattern = r"^[가-힣a-zA-Z0-9\s\.,!\?\"\'\(\)\[\]\:\-\&\/\~\+\*\#]+$"
    return bool(re.fullmatch(pattern, title))

def process_single_tv(item):
    tmdb_id = item['id']
    title = item['name']
    if not is_strictly_clean_title(title): return None

    description = item.get('overview', '').strip()
    keywords_list = []
    
    if len(description) <= 5:
        try:
            res = requests.get(f"https://api.themoviedb.org/3/tv/{tmdb_id}", 
                               params={'api_key': API_KEY, 'language': 'ko-KR', 'append_to_response': 'keywords,translations'}, timeout=10).json()
            keywords_list = [k['name'] for k in res.get('keywords', {}).get('results', [])]
            description = res.get('overview', '').strip()
            if len(description) <= 5:
                translations = res.get('translations', {}).get('translations', [])
                en_trans = next((t for t in translations if t['iso_639_1'] == 'en'), None)
                if en_trans: description = en_trans['data']['overview']
        except: pass
    else:
        try:
            kw_res = requests.get(f"https://api.themoviedb.org/3/tv/{tmdb_id}/keywords", params={'api_key': API_KEY}).json()
            keywords_list = [k['name'] for k in kw_res.get('results', [])]
        except: pass
    
    genre_names = [GENRE_MAP.get(gid) for gid in item.get('genre_ids', []) if GENRE_MAP.get(gid)]
    
    return (tmdb_id, title, 'TV', description if description else None,
            f"https://image.tmdb.org/t/p/w500{item.get('poster_path')}" if item.get('poster_path') else None,
            f"https://image.tmdb.org/t/p/original{item.get('backdrop_path')}" if item.get('backdrop_path') else None,
            item.get('vote_count', 0), json.dumps(genre_names, ensure_ascii=False), json.dumps(keywords_list, ensure_ascii=False))

def run_ingestion():
    if not API_KEY:
        print("❌ 오류: TMDB_API_KEY가 없습니다.")
        return

    try:
        conn = get_db_connection()
        print(f"🚀 TV 시리즈 초기 적재 시작 (Workers: 12) | 대상: ~2026-03-20")
        total_saved = 0
        
        with ThreadPoolExecutor(max_workers=12) as executor:
            for idx, (start, end) in enumerate(date_ranges, 1):
                vote_threshold = 0 if start >= "2026-01-01" else 1
                
                page = 1
                while page <= 500:
                    params = {
                        'api_key': API_KEY, 
                        'language': 'ko-KR', 
                        'first_air_date.gte': start, 
                        'first_air_date.lte': end, 
                        'page': page, 
                        'vote_count.gte': vote_threshold, 
                        'with_original_language': 'ko|en',
                        'sort_by': 'first_air_date.asc'
                    }
                    
                    try:
                        response = requests.get("https://api.themoviedb.org/3/discover/tv", params=params, timeout=10).json()
                        results = response.get('results', [])
                        total_pages = response.get('total_pages', 0)
                    except: break
                    
                    if not results: break
                    
                    futures = [executor.submit(process_single_tv, item) for item in results]
                    batch = [f.result() for f in as_completed(futures) if f.result() is not None]
                    
                    if batch:
                        query = """
                            INSERT INTO contents (tmdb_id, title, type, description, poster_url, banner_poster_url, vote_count, genres, keywords)
                            VALUES %s 
                            ON CONFLICT (tmdb_id) DO UPDATE SET 
                                title = EXCLUDED.title, 
                                description = COALESCE(NULLIF(EXCLUDED.description, ''), contents.description), 
                                vote_count = EXCLUDED.vote_count;
                        """
                        with conn.cursor() as cur:
                            execute_values(cur, query, batch)
                        conn.commit()
                        
                        total_saved += len(batch)
                        print(f"\r[*] 구간 {idx:02d} [{start}~{end}] | {page}/{total_pages}p | 누적: {total_saved:,}개", end='', flush=True)
                    
                    if page >= total_pages: break
                    page += 1
                    time.sleep(0.05)

        conn.close()
        print(f"\n\n✅ 초기 적재 완료! 총 {total_saved:,}개의 TV 시리즈가 저장되었습니다.")
    except Exception as e:
        print(f"\n❌ 오류 발생: {e}")

if __name__ == "__main__":
    run_ingestion()