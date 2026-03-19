package com.almaeng.global.infra.oauth;

public interface OAuthClient {
    // 어떤 소셜사인지 식별 (예: "KAKAO", "GOOGLE", "NAVER")
    String getProvider();

    // 액세스 토큰을 던져서 해당 소셜 서버의 유저 고유 ID를 뜯어옴
    String getProviderId(String accessToken);
}
