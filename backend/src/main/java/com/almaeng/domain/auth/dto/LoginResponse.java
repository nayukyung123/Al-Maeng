package com.almaeng.domain.auth.dto;

public record LoginResponse(
        String accessToken,
        String refreshToken,
        boolean isRegistered
) {}
