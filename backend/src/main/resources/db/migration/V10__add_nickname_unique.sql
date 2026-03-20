-- 정책: 탈퇴한 유저의 닉네임 재사용 불가
ALTER TABLE users ADD CONSTRAINT users_nickname_unique UNIQUE (nickname);