#!/usr/bin/env python3
import os
import psycopg2
import sys
from psycopg2.extras import RealDictCursor
from pathlib import Path
from dotenv import load_dotenv

# [1] 설정 및 환경 변수 로드
current_file = Path(__file__).resolve()
analysis_dir = current_file.parent
data_dir = analysis_dir.parent
root_dir = data_dir.parent

load_dotenv(dotenv_path=root_dir / ".env")
load_dotenv(dotenv_path=data_dir / ".env", override=True)

# [2] 임베딩 모듈 경로 추가 및 로드
processor_path = data_dir / "processors" / "contents"
if str(processor_path) not in sys.path:
    sys.path.append(str(processor_path))

try:
    from embedding import get_embeddings
except ImportError:
    get_embeddings = None

def get_db_connection():
    try:
        # Windows 환경의 UnicodeDecodeError 방지를 위해 client_encoding=utf8 명시
        return psycopg2.connect(
            host=os.getenv("DB_HOST", "127.0.0.1").strip(),
            port=os.getenv("DB_PORT", "5433").strip(),
            database=os.getenv("DB_NAME", "almaeng").strip(),
            user=os.getenv("DB_USERNAME", "almaeng").strip(),
            password=os.getenv("DB_PASSWORD", "almaeng").strip(),
            connect_timeout=5,
            options="-c client_encoding=utf8"
        )
    except Exception as e:
        print(f"❌ DB 접속 실패: {e}")
        return None

def test_recommendation_for_elemental():
    TARGET_CONTENT_ID = 642268  # 엘리멘탈 ID
    MAIN_GENRE_ID = 27594       # '소설/시/희곡' 대분류 ID
    
    conn = get_db_connection()
    if not conn: return
    cur = conn.cursor(cursor_factory=RealDictCursor)

    try:
        # 1. 엘리멘탈의 태그 정보 및 작품 자체의 장르 가져오기
        cur.execute("""
            SELECT t.id, t.tag_name, c.genres
            FROM tags t
            JOIN contents c ON t.content_id = c.id
            WHERE t.content_id = %s 
            ORDER BY t.id ASC LIMIT 3
        """, (TARGET_CONTENT_ID,))
        tags = cur.fetchall()

        if not tags:
            print("⚠️ 태그가 없습니다. 가공 엔진을 먼저 확인하세요.")
            return

        # [핵심] 한 영화 내의 모든 태그/분량 추천 결과가 겹치지 않게 관리하는 세트
        global_recommended_ids = set()

        length_filters = {
            'LIGHT (가볍게)': 'b.page_count > 0 AND b.page_count < 200',
            'MEDIUM (중간)': 'b.page_count >= 200 AND b.page_count <= 400',
            'LONG (장편)': 'b.page_count > 400'
        }

        print("\n" + "="*80)
        print(f"🎬 [엘리멘탈] '탈-키워드' 서사 매칭 및 중복 제거 테스트")
        print(f"   (단순 단어 일치를 배제하고 태그 간 도서 중복을 원천 차단합니다)")
        print("="*80)

        for tag in tags:
            tag_name = tag['tag_name']
            genres = tag['genres']
            genres_str = ", ".join(genres) if isinstance(genres, list) and genres else "정서적인"
            
            print(f"\n📌 분석 태그: {tag_name}")

            # [해결책 1] '키워드 트랩' 방지를 위한 가상 줄거리(Pseudo-Blurb) 생성
            if get_embeddings:
                # 쿼리를 '제목 매칭'이 아닌 '작품의 서사와 분위기 설명'으로 확장
                enriched_query = (
                    f"이 문구는 단순한 키워드가 아니라, [{genres_str}] 장르의 소설이 담고 있는 "
                    f"깊은 서사와 감정의 색채를 묘사합니다: '{tag_name}'. "
                    f"단순히 제목에 이 단어가 포함된 책이 아니라, 전체적인 이야기의 흐름과 분위기가 "
                    f"이 묘사와 일치하는 도서의 한 장면을 찾습니다."
                )
                search_vector = get_embeddings([enriched_query])[0]
                vec_to_use = "[" + ",".join(map(str, search_vector)) + "]"
            else:
                cur.execute("SELECT embedding_vector FROM tags WHERE id = %s", (tag['id'],))
                vec_to_use = cur.fetchone()['embedding_vector']

            for label, condition in length_filters.items():
                print(f"\n   [{label}]")
                
                params = [vec_to_use]
                
                # [해결책 2] 글로벌 중복 방지 (id NOT IN 필터링)
                exclude_sql = ""
                if global_recommended_ids:
                    exclude_sql = " AND b.id NOT IN %s"
                    params.append(tuple(global_recommended_ids))
                
                params.append(vec_to_use)

                # [수정] JOIN 대신 EXISTS를 사용하여 DISTINCT 오류 해결 및 성능 최적화
                query = f"""
                    SELECT b.id, b.title, b.author, 1 - (b.embedding_vector <=> %s) AS score
                    FROM books b
                    WHERE EXISTS (
                        SELECT 1 FROM book_genres bg
                        JOIN genres g ON bg.genre_id = g.id
                        WHERE bg.book_id = b.id
                          AND (g.id = {MAIN_GENRE_ID} OR g.parent_id = {MAIN_GENRE_ID})
                    )
                    AND {condition} 
                    AND b.embedding_vector IS NOT NULL 
                    {exclude_sql}
                    ORDER BY b.embedding_vector <=> %s LIMIT 5
                """
                
                cur.execute(query, params)
                books = cur.fetchall()

                # 결과가 0건일 경우 중복 필터를 풀고 다시 검색 (공백 방지)
                if not books and global_recommended_ids:
                    # 폴백 쿼리에서도 동일하게 EXISTS 적용
                    fallback_query = query.replace(exclude_sql, "")
                    cur.execute(fallback_query, [vec_to_use, vec_to_use])
                    books = cur.fetchall()

                if not books:
                    print("      조회된 도서가 없습니다.")
                    continue

                for i, book in enumerate(books, 1):
                    similarity = round(float(book['score']) * 100, 2)
                    print(f"      {i}. {book['title']} ({book['author']}) | 유사도: {similarity}%")
                    # 추천된 도서를 글로벌 세트에 추가하여 다음 루프에서 제외함
                    global_recommended_ids.add(book['id'])

        print("\n" + "="*80)
        print(f"✅ 테스트 완료 (총 {len(global_recommended_ids)}권의 서로 다른 도서 추천)")

    except Exception as e:
        print(f"❌ 오류: {e}")
    finally:
        cur.close()
        conn.close()

if __name__ == "__main__":
    test_recommendation_for_elemental()