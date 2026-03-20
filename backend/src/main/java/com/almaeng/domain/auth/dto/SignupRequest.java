package com.almaeng.domain.auth.dto;

import jakarta.validation.constraints.*;
import java.util.List;

public record SignupRequest(
        @NotBlank(message = "프로필 이미지 URL은 필수입니다.")
        String profileImageUrl,

        @NotBlank(message = "닉네임은 필수입니다.")
        @Size(min = 2, max = 10, message = "닉네임은 2~10자 사이여야 합니다.")
        @Pattern(regexp = "^[가-힣a-zA-Z0-9]+$", message = "닉네임은 자음/모음 단독 사용 및 띄어쓰기가 불가합니다.")
        String nickname,

        @NotNull(message = "출생연도는 필수입니다.")
        @Min(value = 1900, message = "유효하지 않은 출생연도입니다.")
        @Max(value = 2026, message = "출생연도는 현재 연도를 넘을 수 없습니다.")
        Integer birthYear,

        @NotNull(message = "성별은 필수입니다.")
        // sqlll.txt 기준 gender가 INT이므로 Integer로 받습니다. (프론트와 0:여성, 1:남성 등 규약 필요)
        Integer gender,

        @NotEmpty(message = "최소 하나 이상의 취향 정보를 선택해야 합니다.")
        @Size(min = 1, message = "취향 정보 배열이 비어있을 수 없습니다.")
        List<String> tasteData
) {}