-- V2__align_v1_to_final_erd.sql

CREATE EXTENSION IF NOT EXISTS vector;

-- =========================================================
-- 1) ERD에 없는 V1 흔적 제거
-- =========================================================

-- 통합 이벤트 로그 제거 (ERD에는 search_log / view_log 분리)
DROP TABLE user_events;

-- ERD에는 contents.genres(JSONB)가 있으므로 조인 테이블 제거
DROP TABLE contents_genres;

-- user_completed_books 안에 섞여 있던 티켓 관련 컬럼 제거
ALTER TABLE user_completed_books DROP COLUMN ticket_created;
ALTER TABLE user_completed_books DROP COLUMN comment;
ALTER TABLE user_completed_books DROP COLUMN ticket_image_url;

-- genres.type 은 최종 ERD 기준 없음
ALTER TABLE genres DROP COLUMN type;


-- =========================================================
-- 2) 기존 테이블 구조를 최종 ERD 기준으로 보정
-- =========================================================

-- 2-1. users
ALTER TABLE users
    ALTER COLUMN tier_id SET NOT NULL,
    ALTER COLUMN nickname SET NOT NULL;

-- gender: VARCHAR(10) -> INT
ALTER TABLE users
    ALTER COLUMN gender TYPE INT
    USING CASE
        WHEN gender IS NULL OR trim(gender) = '' THEN NULL
        ELSE gender::INT
    END;

-- nickname UNIQUE 제거 (최종 ERD에 없음 / 제약 최소화)
ALTER TABLE users DROP CONSTRAINT users_nickname_key;


-- 2-2. social_accounts
-- 기존 PK(user_id, provider) -> id PK 구조로 변경
ALTER TABLE social_accounts DROP CONSTRAINT social_accounts_pkey;

ALTER TABLE social_accounts
    ADD COLUMN id BIGSERIAL;

ALTER TABLE social_accounts
    ADD CONSTRAINT social_accounts_pkey PRIMARY KEY (id);

ALTER TABLE social_accounts
    ALTER COLUMN user_id SET NOT NULL;


-- 2-3. books
ALTER TABLE books
    ALTER COLUMN title SET NOT NULL,
    ALTER COLUMN author SET NOT NULL;

-- slug UNIQUE 제거 (최종 ERD에 없음 / 제약 최소화)
ALTER TABLE books DROP CONSTRAINT books_slug_key;


-- 2-4. contents
ALTER TABLE contents
    ADD COLUMN keywords JSONB,
    ADD COLUMN vote_count BIGINT,
    ADD COLUMN genres JSONB;


-- 2-5. tags
ALTER TABLE tags
    ALTER COLUMN content_id SET NOT NULL;

-- 최종 ERD에서 tag_name nullable
ALTER TABLE tags
    ALTER COLUMN tag_name DROP NOT NULL;


-- 2-6. ranking
ALTER TABLE ranking
    ALTER COLUMN book_id SET NOT NULL,
    ALTER COLUMN rank SET NOT NULL,
    ALTER COLUMN rank_category SET NOT NULL;

-- score: FLOAT -> INT
ALTER TABLE ranking
    ALTER COLUMN score TYPE INT
    USING CASE
        WHEN score IS NULL THEN NULL
        ELSE ROUND(score)::INT
    END;


-- 2-7. user_recommendation_pool
ALTER TABLE user_recommendation_pool
    ALTER COLUMN user_id SET NOT NULL,
    ALTER COLUMN book_id SET NOT NULL;


-- 2-8. user_completed_books
ALTER TABLE user_completed_books
    ALTER COLUMN user_id SET NOT NULL,
    ALTER COLUMN book_id SET NOT NULL;


-- 2-9. reviews
ALTER TABLE reviews
    ALTER COLUMN user_id SET NOT NULL,
    ALTER COLUMN book_id SET NOT NULL;

-- 평점 체크 제거 (최종 ERD에 없음 / 제약 최소화)
ALTER TABLE reviews DROP CONSTRAINT reviews_rating_check;


-- 2-10. user_wishlist
ALTER TABLE user_wishlist
    ALTER COLUMN user_id SET NOT NULL,
    ALTER COLUMN book_id SET NOT NULL;


-- 2-11. users_genres
ALTER TABLE users_genres
    ALTER COLUMN user_id SET NOT NULL,
    ALTER COLUMN genre_id SET NOT NULL;


-- 2-12. book_genres
ALTER TABLE book_genres
    ALTER COLUMN book_id SET NOT NULL,
    ALTER COLUMN genre_id SET NOT NULL;


-- 2-13. user_taste_report_genres
ALTER TABLE user_taste_report_genres
    ALTER COLUMN user_id SET NOT NULL,
    ALTER COLUMN genre_id SET NOT NULL;


-- 2-14. book_similarity
ALTER TABLE book_similarity
    ALTER COLUMN book_id SET NOT NULL,
    ALTER COLUMN similar_book_id SET NOT NULL;


-- 2-15. top_contents
ALTER TABLE top_contents
    ALTER COLUMN content_id SET NOT NULL;


-- =========================================================
-- 3) 최종 ERD에 맞춰 신규 테이블 생성
-- =========================================================

-- 검색 로그
CREATE TABLE search_log (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id),
    keyword VARCHAR(100),
    created_at TIMESTAMP
);

-- 조회 로그
CREATE TABLE view_log (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id),
    book_id BIGINT NOT NULL REFERENCES books(id),
    created_at TIMESTAMP
);

-- 콘텐츠 기반 도서 추천
CREATE TABLE content_book_recommendations (
    id BIGSERIAL PRIMARY KEY,
    content_id BIGINT NOT NULL REFERENCES contents(id),
    book_id BIGINT NOT NULL REFERENCES books(id),
    score DECIMAL(5,4),
    rank INT,
    reason_type VARCHAR(50),
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

-- 완독 티켓
CREATE TABLE tickets (
    id BIGSERIAL PRIMARY KEY,
    completed_book_id BIGINT NOT NULL REFERENCES user_completed_books(id),
    comment VARCHAR(255),
    ticket_image_url TEXT,
    created_at TIMESTAMP
);