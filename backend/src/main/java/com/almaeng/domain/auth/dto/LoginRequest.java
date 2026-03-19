package com.almaeng.domain.auth.dto;

import jakarta.validation.constraints.NotBlank;

public record LoginRequest(
        @NotBlank(message = "소셜 토큰은 필수입니다.")
        String accessToken
){}
