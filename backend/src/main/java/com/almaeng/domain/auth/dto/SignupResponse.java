package com.almaeng.domain.auth.dto;

public record SignupResponse(
        String message
) {
    public static SignupResponse success() {
        return new SignupResponse("회원가입(온보딩)이 성공적으로 완료되었습니다.");
    }
}