-- 소셜 로그인 시 동일한 provider와 provider_id가 중복 저장되는 동시성 버그 방지
ALTER TABLE social_accounts
    ADD CONSTRAINT uk_social_account_provider_id UNIQUE (provider, provider_id);