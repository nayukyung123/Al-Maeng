-- 1. 기존의 복합 키(user_id, genre_id) 제약 조건 삭제
ALTER TABLE user_taste_report_genres DROP CONSTRAINT user_taste_report_genres_pkey;

-- 2. 자바가 원하는 'id' 컬럼을 자동 증가 번호(BIGSERIAL)로 추가하고 PK로 설정
ALTER TABLE user_taste_report_genres ADD COLUMN id BIGSERIAL PRIMARY KEY;