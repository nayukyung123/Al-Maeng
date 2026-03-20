-- V11__rollback_init_genres_and_add_is_selectable_to_genres.sql

-- ==========================================================
-- 1. 기존 users_genres 테이블 삭제 (init_genres 참조 끊기)
-- ==========================================================
DROP TABLE IF EXISTS users_genres;

-- ==========================================================
-- 2. init_genres 테이블 완전 삭제
-- ==========================================================
DROP TABLE IF EXISTS init_genres;

-- ==========================================================
-- 3. genres 테이블에 노출 여부 컬럼 추가
-- ==========================================================
-- 기본값을 FALSE로 주어 실수로 원치 않는 장르가 노출되는 것을 방지
ALTER TABLE genres
    ADD COLUMN is_selectable BOOLEAN DEFAULT FALSE;

-- ==========================================================
-- 4. users_genres 테이블 재구성 (users <-> genres 올바른 연결)
-- ==========================================================
CREATE TABLE users_genres (
    user_id BIGINT NOT NULL,
    genre_id BIGINT NOT NULL,
    PRIMARY KEY (user_id, genre_id),

    CONSTRAINT fk_users_genres_user
        FOREIGN KEY (user_id)
            REFERENCES users(id)
            ON DELETE CASCADE,

    CONSTRAINT fk_users_genres_genre
        FOREIGN KEY (genre_id)
            REFERENCES genres(id)
            ON DELETE CASCADE
);