-- tickets 테이블에 style_data 컬럼 추가 (JSONB 타입)
ALTER TABLE tickets ADD COLUMN style_data jsonb NOT NULL DEFAULT '{}'::jsonb;