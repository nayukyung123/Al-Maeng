-- 1. users 테이블에 소프트 삭제용 is_deleted 컬럼 추가
ALTER TABLE users ADD COLUMN is_deleted BOOLEAN NOT NULL DEFAULT false;