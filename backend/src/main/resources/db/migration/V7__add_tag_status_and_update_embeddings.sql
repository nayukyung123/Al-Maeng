-- tag_status 컬럼 추가
ALTER TABLE contents 
ADD COLUMN tag_status VARCHAR(20) DEFAULT 'READY';

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_contents_tag_status ON contents(tag_status);

-- 코멘트
COMMENT ON COLUMN contents.tag_status 
IS 'AI 태그 생성 상태 (READY: 대기, PROCESSING: 진행중, COMPLETED: 완료, FAILED: 실패)';

-- users 벡터
ALTER TABLE users
ALTER COLUMN embedding_vector TYPE vector(1024);

-- books 벡터
ALTER TABLE books
ALTER COLUMN embedding_vector TYPE vector(1024);

-- tags 벡터
ALTER TABLE tags
ALTER COLUMN embedding_vector TYPE vector(1024);

-- books isbn unique
ALTER TABLE books
ADD CONSTRAINT books_isbn_unique UNIQUE (isbn);

-- genres unique
ALTER TABLE genres
ADD CONSTRAINT genres_name_unique UNIQUE (genre_name);