-- V19__add_indexes_for_taste_report_live_aggregation.sql
--
-- 완독 장르 즉시집계 API 성능 최적화 인덱스
-- 1) user_completed_books(user_id): 사용자 완독 목록 필터링 가속
-- 2) book_genres(book_id): 완독 도서 -> 장르 조인 가속
-- 3) genres(parent_id): 상위/하위 장르 집계(트리 탐색) 가속

CREATE INDEX IF NOT EXISTS idx_user_completed_books_user_id
ON user_completed_books (user_id);

CREATE INDEX IF NOT EXISTS idx_book_genres_book_id
ON book_genres (book_id);

CREATE INDEX IF NOT EXISTS idx_genres_parent_id
ON genres (parent_id);
