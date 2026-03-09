-- 0. 확장 기능 활성화 (반드시 먼저 실행)
CREATE EXTENSION IF NOT EXISTS vector;

-- 1. 등급 (tiers)
CREATE TABLE tiers (
                       id INT PRIMARY KEY,
                       tier_name VARCHAR(50) NOT NULL,
                       min_exp INT NOT NULL DEFAULT 0
);

-- 2. 장르 (genres)
CREATE TABLE genres (
                        id BIGSERIAL PRIMARY KEY,
                        parent_id BIGINT REFERENCES genres(id),
                        genre_name VARCHAR(100) NOT NULL,
                        type VARCHAR(20) NOT NULL -- 'BOOK', 'CONTENT', 'COMMON' 등
);

-- 3. 사용자 (users)
CREATE TABLE users (
                       id BIGSERIAL PRIMARY KEY,
                       tier_id INT REFERENCES tiers(id),
                       nickname VARCHAR(100) UNIQUE NOT NULL,
                       profile_image_url TEXT,
                       created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                       updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                       birth_year INT,
                       completed_count INT DEFAULT 0,
                       preference_count INT DEFAULT 0,
                       gender VARCHAR(10),
                       embedding_vector VECTOR(1536) -- 취향 분석용 벡터
);

-- 4. 소셜 인증 (social_accounts)
CREATE TABLE social_accounts (
                                 user_id BIGINT REFERENCES users(id),
                                 provider VARCHAR(20), -- 'KAKAO', 'NAVER' 등
                                 provider_id VARCHAR(255),
                                 PRIMARY KEY (user_id, provider)
);

-- 5. 유저 행동 로그 (user_events)
CREATE TABLE user_events (
                             id BIGSERIAL PRIMARY KEY,
                             user_id BIGINT REFERENCES users(id),
                             event_type VARCHAR(50) NOT NULL, -- 'VIEW', 'WISH', 'COMPLETE'
                             target_type VARCHAR(50) NOT NULL, -- 'BOOK', 'CONTENT'
                             target_id BIGINT NOT NULL,
                             metadata JSONB, -- 추가 로그 정보
                             created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. 도서 (books)
CREATE TABLE books (
                       id BIGSERIAL PRIMARY KEY,
                       title VARCHAR(255) NOT NULL,
                       author VARCHAR(255),
                       description TEXT,
                       page_count INT,
                       isbn VARCHAR(20),
                       published_date DATE,
                       cover_image_url TEXT,
                       average_rating DECIMAL(2,1) DEFAULT 0.0,
                       created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                       embedding_vector VECTOR(1536), -- 도서 특징 벡터
                       slug VARCHAR(255) UNIQUE -- URL 친화적 식별자
);

-- 7. 영상 콘텐츠 (contents)
CREATE TABLE contents (
                          id BIGSERIAL PRIMARY KEY,
                          tmdb_id BIGINT,
                          title VARCHAR(255) NOT NULL,
                          type VARCHAR(20), -- 'MOVIE', 'DRAMA'
                          description TEXT,
                          poster_url TEXT,
                          banner_poster_url TEXT
);

-- 8. 영상 콘텐츠 태그 (tags)
CREATE TABLE tags (
                      id BIGSERIAL PRIMARY KEY,
                      content_id BIGINT REFERENCES contents(id),
                      tag_name VARCHAR(100) NOT NULL,
                      embedding_vector VECTOR(1536) -- 태그별 특징 벡터
);

-- 9. 도서 랭킹 (ranking) - 이미지에서 추가된 테이블
CREATE TABLE ranking (
                         id BIGSERIAL PRIMARY KEY,
                         book_id BIGINT REFERENCES books(id),
                         rank INT NOT NULL,
                         rank_category VARCHAR(20) NOT NULL, -- 'VIEWS', 'WISHLIST', 'COMPLETED'
                         score FLOAT,
                         rank_date DATE DEFAULT CURRENT_DATE,
                         created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 10. 추천 후보군 (user_recommendation_pool) - 이미지에서 추가된 테이블
CREATE TABLE user_recommendation_pool (
                                          id BIGSERIAL PRIMARY KEY,
                                          user_id BIGINT REFERENCES users(id),
                                          book_id BIGINT REFERENCES books(id),
                                          score FLOAT, -- 추천 적합도 점수
                                          reason_type VARCHAR(50), -- 'VECTOR', 'SOULMATE' 등
                                          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 11. 완독 리스트 (user_completed_books)
CREATE TABLE user_completed_books (
                                      id BIGSERIAL PRIMARY KEY,
                                      user_id BIGINT REFERENCES users(id),
                                      book_id BIGINT REFERENCES books(id),
                                      ticket_created BOOLEAN DEFAULT FALSE,
                                      completed_at TIMESTAMP,
                                      comment VARCHAR(255),
                                      ticket_image_url TEXT,
                                      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 12. 리뷰 (reviews)
CREATE TABLE reviews (
                         id BIGSERIAL PRIMARY KEY,
                         user_id BIGINT REFERENCES users(id),
                         book_id BIGINT REFERENCES books(id),
                         rating INT CHECK (rating >= 1 AND rating <= 5),
                         content TEXT,
                         spoiler BOOLEAN DEFAULT FALSE,
                         created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                         updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 13. 찜 리스트 (user_wishlist)
CREATE TABLE user_wishlist (
                               id BIGSERIAL PRIMARY KEY,
                               user_id BIGINT REFERENCES users(id),
                               book_id BIGINT REFERENCES books(id),
                               created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 14. 매핑 테이블들 (N:M 관계)
CREATE TABLE users_genres (
                              user_id BIGINT REFERENCES users(id),
                              genre_id BIGINT REFERENCES genres(id),
                              PRIMARY KEY (user_id, genre_id)
);

CREATE TABLE book_genres (
                             book_id BIGINT REFERENCES books(id),
                             genre_id BIGINT REFERENCES genres(id),
                             PRIMARY KEY (book_id, genre_id)
);

CREATE TABLE contents_genres (
                                 content_id BIGINT REFERENCES contents(id),
                                 genre_id BIGINT REFERENCES genres(id),
                                 PRIMARY KEY (content_id, genre_id)
);

-- 15. 통계 및 기타
CREATE TABLE user_taste_report_genres (
                                          user_id BIGINT REFERENCES users(id),
                                          genre_id BIGINT REFERENCES genres(id),
                                          score FLOAT,
                                          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                                          PRIMARY KEY (user_id, genre_id)
);

CREATE TABLE book_similarity (
                                 book_id BIGINT REFERENCES books(id),
                                 similar_book_id BIGINT REFERENCES books(id),
                                 similarity_score FLOAT,
                                 updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                                 PRIMARY KEY (book_id, similar_book_id)
);

CREATE TABLE top_contents (
                              content_id BIGINT REFERENCES contents(id) PRIMARY KEY,
                              rank INT,
                              type VARCHAR(20),
                              updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);