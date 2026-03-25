package com.almaeng.domain.auth.dto;

public record SignupResponse(
        String accessToken,
        String refreshToken,
        String message
) {
    public static SignupResponse success(String accessToken, String refreshToken) {
        return new SignupResponse(accessToken, refreshToken,"회원가입(온보딩)이 성공적으로 완료되었습니다.");
    }
}