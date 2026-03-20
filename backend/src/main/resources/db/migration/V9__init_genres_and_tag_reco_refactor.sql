-- V9__init_genres_and_tag_reco_refactor.sql

-- ==========================================================
-- 1. init_genres 테이블 생성 (초기 장르 선택용)
-- ==========================================================
CREATE TABLE IF NOT EXISTS init_genres (
                                           id BIGSERIAL PRIMARY KEY,
                                           parent_id BIGINT NULL,
                                           genre_name VARCHAR(100) NOT NULL,
                                           mapped_genre_id BIGINT NULL -- 원본 genres 테이블과의 연결 고리
);

-- self FK (트리 구조)
ALTER TABLE init_genres
    ADD CONSTRAINT fk_init_genres_parent
        FOREIGN KEY (parent_id)
            REFERENCES init_genres(id)
            ON DELETE SET NULL;

-- 원본 장르 매핑 FK 추가 (추천 로직을 위한 안전장치)
ALTER TABLE init_genres
    ADD CONSTRAINT fk_init_genres_mapped
        FOREIGN KEY (mapped_genre_id)
            REFERENCES genres(id)
            ON DELETE SET NULL;


-- ==========================================================
-- 2. users_genres 테이블 재구성 (init_genres 기준)
-- ==========================================================
-- 기존 users_genres 삭제 (구조 변경이므로 drop이 안전)
DROP TABLE IF EXISTS users_genres;

CREATE TABLE users_genres (
                              user_id BIGINT NOT NULL,
                              init_genre_id BIGINT NOT NULL,
                              PRIMARY KEY (user_id, init_genre_id),

                              CONSTRAINT fk_users_genres_user
                                  FOREIGN KEY (user_id)
                                      REFERENCES users(id)
                                      ON DELETE CASCADE,

                              CONSTRAINT fk_users_genres_init
                                  FOREIGN KEY (init_genre_id)
                                      REFERENCES init_genres(id)
                                      ON DELETE CASCADE
);


-- ==========================================================
-- 3. 추천 테이블 구조 변경 (content → tag 기반)
-- ==========================================================

-- 기존 테이블 rename
ALTER TABLE IF EXISTS content_book_recommendations
    RENAME TO tag_book_recommendations;

-- 기존 FK 제거를 위해 컬럼 삭제
ALTER TABLE tag_book_recommendations
    DROP COLUMN IF EXISTS content_id;

-- tag_id 추가
ALTER TABLE tag_book_recommendations
    ADD COLUMN tag_id BIGINT NOT NULL;

-- FK 설정
ALTER TABLE tag_book_recommendations
    ADD CONSTRAINT fk_tag_reco_tag
        FOREIGN KEY (tag_id)
            REFERENCES tags(id)
            ON DELETE CASCADE;


-- ==========================================================
-- 4. contents unique 제약 변경 (tmdb_id + type)
-- ==========================================================

-- 기존 unique 제거
ALTER TABLE contents
    DROP CONSTRAINT IF EXISTS contents_tmdb_id_unique;

-- 복합 unique 추가
ALTER TABLE contents
    ADD CONSTRAINT unique_tmdb_id_type UNIQUE (tmdb_id, type);