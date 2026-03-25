package com.almaeng.domain.user.dto;

import com.almaeng.domain.user.entity.Gender;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.Positive;

import java.util.List;

public record UserProfileUpdateRequest(
        @Size(min = 2, max = 10, message = "닉네임은 2자 이상 10자 이하여야 합니다.")
        @Pattern(regexp = "^[가-힣a-zA-Z0-9]+$", message = "닉네임은 특수문자나 띄어쓰기를 포함할 수 없습니다.")
        String nickname,
        String profileImageUrl,
        @Min(value = 1900, message = "출생년도는 1900년 이후여야 합니다.")
        @Max(value = 2100, message = "출생년도는 2100년 이전이어야 합니다.")
        Integer birthYear,
        Gender gender,
        List<@Positive(message = "유효하지 않은 장르 ID입니다.") Long> tasteData
) {
}
