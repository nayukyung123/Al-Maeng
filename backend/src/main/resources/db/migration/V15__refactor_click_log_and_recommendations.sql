-- 1. view_log -> click_log
ALTER TABLE view_log RENAME TO click_log;

-- 2. click_log 컬럼 추가
-- 'search', 'curation', 'ranking', 'content', 'book', 'trend', 'none' 등의 값이 들어갈 예정
ALTER TABLE click_log ADD COLUMN source VARCHAR(50) NOT NULL;
-- 'view', 'wish', 'wish_cancel', 'complete', 'complete_cancel' 값이 들어갈 예정
ALTER TABLE click_log ADD COLUMN action VARCHAR(50) NOT NULL;

-- 3. click_log 인덱스 추가
CREATE INDEX idx_click_log_user_book_created
ON click_log(user_id, book_id, created_at DESC);

-- 4. search_log 삭제
DROP TABLE search_log;

-- 5. tag_book_recommendations 수정
ALTER TABLE tag_book_recommendations DROP COLUMN reason_type;
-- 'LIGHT'(가볍게), 'MEDIUM'(중간), 'LONG'(장편) 값이 들어갈 예정
ALTER TABLE tag_book_recommendations ADD COLUMN length_type VARCHAR(20) NOT NULL;

-- 6. 추천 테이블 인덱스 추가
CREATE INDEX idx_recommendations_tag_length
ON tag_book_recommendations(tag_id, length_type);