-- 중복 찜하기 방지를 위한 유니크 제약 조건
ALTER TABLE user_wishlist ADD CONSTRAINT uk_user_wishlist UNIQUE (user_id, book_id);

-- 찜 목록 최신순 조회 성능 최적화를 위한 인덱스
CREATE INDEX idx_user_wishlist_user_created ON user_wishlist(user_id, created_at DESC);