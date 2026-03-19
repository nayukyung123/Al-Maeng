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

# 설정 로드: 명시적 경로 로드 방식을 유지합니다.
current_file = Path(__file__).resolve()
data_dir = current_file.parent.parent  # data 폴더 (API KEY 위치)
root_dir = data_dir.parent             # 프로젝트 루트 폴더 (DB 정보 위치)

if (root_dir / ".env").exists():
    load_dotenv(dotenv_path=root_dir / ".env", override=True)
    print(f"✅ 루트 .env 로드 완료: {root_dir / '.env'}")

if (data_dir / ".env").exists():
    load_dotenv(dotenv_path=data_dir / ".env", override=True)
    print(f"✅ 데이터 .env 로드 완료: {data_dir / '.env'}")

# 환경 변수 매핑
API_KEY = os.getenv("TMDB_API_KEY")
DB_HOST = os.getenv("DB_HOST", "127.0.0.1")
DB_PORT = os.getenv("DB_PORT", "5433") 
DB_NAME = os.getenv("DB_NAME")
DB_USER = os.getenv("DB_USERNAME")
DB_PASSWORD = os.getenv("DB_PASSWORD")

print(f"🔍 접속 정보 확인 -> Host: {DB_HOST}, Port: {DB_PORT}, DB: {DB_NAME}, User: {DB_USER}")

# HTTP 세션 설정 (연결 재사용 및 커넥션 풀 확장)
session = requests.Session()
adapter = requests.adapters.HTTPAdapter(pool_connections=20, pool_maxsize=20)
session.mount('https://', adapter)

# TV 장르 마스터 맵
GENRE_MAP = {
    10759: "액션 및 어드벤처", 16: "애니메이션", 35: "코미디", 80: "범죄", 
    99: "다큐멘터리", 18: "드라마", 10751: "가족", 10762: "키즈", 
    9648: "미스터리", 10763: "뉴스", 10764: "리얼리티", 10765: "SF 및 판타지", 
    10766: "연속극", 10767: "토크", 10768: "전쟁 및 정치", 37: "서부"
}

def get_db_connection():
    return psycopg2.connect(host=DB_HOST, port=DB_PORT, database=DB_NAME, user=DB_USER, password=DB_PASSWORD)

def has_korean(text):
    """제목 내 한글 포함 여부 확인"""
    if not text: return False
    return bool(re.search(r'[가-힣]', text))

def has_valid_language(text):
    """줄거리 내 한글/영어 포함 여부 확인 (기타 언어 단독 사용 배제)"""
    if not text: return False
    return bool(re.search(r'[가-힣a-zA-Z]', text))

def process_single_tv(item):
    """
    개별 작품 가공 로직:
    - 제목 한글 필수
    - 줄거리 5자 이하: 상세 API(번역/키워드) 호출
    - 줄거리 충분: 키워드 API 단독 호출
    - 한/영 줄거리 부재 시 최종 제외
    """
    tmdb_id = item['id']
    title = item.get('name', '')
    
    if not has_korean(title):
        return None

    description = item.get('overview', '').strip()
    keywords_list = []
    
    try:
        # 줄거리 부실 시 상세 정보/키워드/번역본 통합 요청
        if len(description) <= 5:
            res = session.get(
                f"https://api.themoviedb.org/3/tv/{tmdb_id}", 
                params={'api_key': API_KEY, 'language': 'ko-KR', 'append_to_response': 'keywords,translations'}, 
                timeout=10
            ).json()
            keywords_list = [k['name'] for k in res.get('keywords', {}).get('results', [])]
            description = res.get('overview', '').strip()
            
            # 한국어 부재 시 영어 번역본 대체
            if len(description) <= 5:
                translations = res.get('translations', {}).get('translations', [])
                en_trans = next((t for t in translations if t['iso_639_1'] == 'en'), None)
                if en_trans:
                    description = en_trans['data'].get('overview', '').strip()
        else:
            # 줄거리 충분 시 키워드만 별도 호출
            kw_res = session.get(
                f"https://api.themoviedb.org/3/tv/{tmdb_id}/keywords", 
                params={'api_key': API_KEY}, 
                timeout=10
            ).json()
            keywords_list = [k['name'] for k in kw_res.get('results', [])]
    except Exception:
        pass
    
    # 길이 및 언어 유효성 미달 시 제외
    if len(description) <= 5 or not has_valid_language(description):
        return None
    
    genre_names = [GENRE_MAP.get(gid) for gid in item.get('genre_ids', []) if GENRE_MAP.get(gid)]
    release_date = item.get('first_air_date')
    if not release_date: release_date = None
    
    return (tmdb_id, title, 'TV', description,
            f"https://image.tmdb.org/t/p/w500{item.get('poster_path')}" if item.get('poster_path') else None,
            f"https://image.tmdb.org/t/p/original{item.get('backdrop_path')}" if item.get('backdrop_path') else None,
            json.dumps(keywords_list, ensure_ascii=False),
            item.get('vote_count', 0), 
            json.dumps(genre_names, ensure_ascii=False),
            release_date)

def run_tv_ingestion():
    # 수집 대상 날짜 구간 설정
    date_ranges = [
        ("1950-01-01", "1989-12-31"), ("1990-01-01", "1999-12-31"),
        ("2000-01-01", "2007-12-31"), ("2008-01-01", "2011-12-31"),
        ("2012-01-01", "2014-12-31"), ("2015-01-01", "2017-12-31"),
        ("2018-01-01", "2019-12-31"), ("2020-01-01", "2021-12-31"),
        ("2022-01-01", "2023-12-31"), ("2024-01-01", "2025-12-31"),
        ("2026-01-01", "2026-03-31")
    ]
    
    try:
        conn = get_db_connection()
        print(f"🚀 TV 시리즈 품질 최적화 적재 시작 (Workers: 15)")
        total_saved = 0
        
        for idx, (start, end) in enumerate(date_ranges, 1):
            # 2026년 이후 평점 0점 데이터 수집 포함
            vote_threshold = 0 if start >= "2026-01-01" else 1
            
            # 구간별 전체 페이지 수 조회 (최대 500p 제한)
            init_res = session.get("https://api.themoviedb.org/3/discover/tv", params={
                'api_key': API_KEY, 'first_air_date.gte': start, 'first_air_date.lte': end, 'vote_count.gte': vote_threshold
            }).json()
            total_pages = min(init_res.get('total_pages', 0), 500)
            
            print(f"\n[*] 구간 {idx:02d} [{start}~{end}] | 평점 {vote_threshold}+ | {total_pages}p")

            # 페이지 내 아이템 병렬 처리 (속도 최적화)
            with ThreadPoolExecutor(max_workers=15) as executor:
                for page in range(1, total_pages + 1):
                    params = {
                        'api_key': API_KEY, 'language': 'ko-KR', 
                        'first_air_date.gte': start, 'first_air_date.lte': end, 
                        'page': page, 'vote_count.gte': vote_threshold,
                        'sort_by': 'first_air_date.asc'
                    }
                    
                    try:
                        resp = session.get("https://api.themoviedb.org/3/discover/tv", params=params, timeout=10).json()
                        results = resp.get('results', [])
                        if not results: break
                        
                        futures = [executor.submit(process_single_tv, item) for item in results]
                        batch = [f.result() for f in as_completed(futures) if f.result() is not None]
                        
                        if batch:
                            # 품질 우선 데이터 업데이트 (UPSERT)
                            query = """
                                INSERT INTO contents (
                                    tmdb_id, title, type, description, poster_url, 
                                    banner_poster_url, keywords, vote_count, genres, release_date
                                ) VALUES %s 
                                ON CONFLICT (tmdb_id, type) DO UPDATE SET 
                                    -- 1. 줄거리: 더 긴 텍스트 선택 (정보량 보존)
                                    description = CASE 
                                        WHEN LENGTH(COALESCE(EXCLUDED.description, '')) > LENGTH(COALESCE(contents.description, '')) 
                                        THEN EXCLUDED.description ELSE contents.description 
                                    END,
                                    -- 2. 키워드: 원소 개수 많은 쪽 선택 (추천 데이터 확보)
                                    keywords = CASE 
                                        WHEN jsonb_array_length(COALESCE(EXCLUDED.keywords, '[]'::jsonb)) > jsonb_array_length(COALESCE(contents.keywords, '[]'::jsonb))
                                        THEN EXCLUDED.keywords ELSE contents.keywords 
                                    END,
                                    -- 3. 장르: 원소 개수 많은 쪽 선택 (장르 데이터 보존)
                                    genres = CASE 
                                        WHEN jsonb_array_length(COALESCE(EXCLUDED.genres, '[]'::jsonb)) > jsonb_array_length(COALESCE(contents.genres, '[]'::jsonb))
                                        THEN EXCLUDED.genres ELSE contents.genres 
                                    END,
                                    -- 4. 기타 정보(투표수/날짜) 최신화
                                    vote_count = GREATEST(EXCLUDED.vote_count, contents.vote_count),
                                    release_date = EXCLUDED.release_date;
                            """
                            with conn.cursor() as cur:
                                execute_values(cur, query, batch)
                            conn.commit()
                            total_saved += len(batch)
                            print(f"\r[+] 누적 유효 데이터 적재: {total_saved:,}개", end='', flush=True)
                        
                        # API 속도 제한 준수용 지연
                        time.sleep(0.05)
                    except Exception as e:
                        print(f"\n⚠️ {page}페이지 처리 중 오류: {e}")
                        continue

        conn.close()
        print(f"\n\n✅ 수집 완료! 총 {total_saved:,}개의 필터링된 TV 데이터 저장 완료.")
    except Exception as e:
        print(f"\n❌ 치명적 오류 발생: {e}")

if __name__ == "__main__":
    run_tv_ingestion()