-- users 테이블에 취향 정보 저장을 위한 JSONB 컬럼 추가
ALTER TABLE users
    ADD COLUMN IF NOT EXISTS taste_data JSONB DEFAULT '[]'::jsonb;