-- V18__add_timestamp_triggers_and_performance_indexes.sql

-- -----------------------------------------------------------------------------
-- [1] 공용 트리거 함수 (updated_at 자동 갱신용)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- -----------------------------------------------------------------------------
-- [2] 테이블별 타임스탬프 자동화 
-- (주의: users, reviews는 JPA @UpdateTimestamp가 관리하므로 트리거에서 제외)
-- -----------------------------------------------------------------------------

-- 1) click_log, tickets: 생성 시각 자동 기록
ALTER TABLE click_log ALTER COLUMN created_at SET DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE tickets ALTER COLUMN created_at SET DEFAULT CURRENT_TIMESTAMP;

-- 2) 엔티티가 없거나 DB 배치로 도는 테이블들만 트리거 적용
ALTER TABLE tag_book_recommendations ALTER COLUMN created_at SET DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE tag_book_recommendations ALTER COLUMN updated_at SET DEFAULT CURRENT_TIMESTAMP;
DROP TRIGGER IF EXISTS trg_update_tag_book_rec ON tag_book_recommendations;
CREATE TRIGGER trg_update_tag_book_rec BEFORE UPDATE ON tag_book_recommendations FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

DROP TRIGGER IF EXISTS trg_update_user_taste_report ON user_taste_report_genres;
CREATE TRIGGER trg_update_user_taste_report BEFORE UPDATE ON user_taste_report_genres FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

DROP TRIGGER IF EXISTS trg_update_book_similarity ON book_similarity;
CREATE TRIGGER trg_update_book_similarity BEFORE UPDATE ON book_similarity FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

DROP TRIGGER IF EXISTS trg_update_top_contents ON top_contents;
CREATE TRIGGER trg_update_top_contents BEFORE UPDATE ON top_contents FOR EACH ROW EXECUTE PROCEDURE update_modified_column();


-- -----------------------------------------------------------------------------
-- [3] 성능 최적화 인덱스 (추천 시스템 및 조회 가속)
-- -----------------------------------------------------------------------------

-- 1) 벡터 유사도 검색 가속 (HNSW)
CREATE INDEX IF NOT EXISTS idx_books_embedding_hnsw 
ON books USING hnsw (embedding_vector vector_cosine_ops);

-- 2) 장르 필터링 가속 (단일 인덱스로 수정: PK 중복 제거)
CREATE INDEX IF NOT EXISTS idx_book_genres_genre ON book_genres (genre_id);

-- 3) 독서 분량 필터링 가속 (B-Tree)
CREATE INDEX IF NOT EXISTS idx_books_page_count ON books (page_count);

-- 4) 원본 데이터 그룹화 가속
CREATE INDEX IF NOT EXISTS idx_tags_content_id ON tags (content_id);

-- -----------------------------------------------------------------------------
-- [4] 성능 최적화 인덱스 (검색 기능 고도화)
-- -----------------------------------------------------------------------------

CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS idx_books_title_norm_trgm
ON books USING gin (lower(replace(title, ' ', '')) gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_books_author_norm_trgm
ON books USING gin (lower(replace(author, ' ', '')) gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_books_published_date_id
ON books (published_date DESC, id DESC);

CREATE INDEX IF NOT EXISTS idx_books_avg_rating_id
ON books (average_rating DESC, id DESC);