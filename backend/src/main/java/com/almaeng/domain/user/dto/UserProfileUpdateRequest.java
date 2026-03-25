package com.almaeng.domain.user.dto;

import com.almaeng.domain.user.entity.Gender;

import java.util.List;

public record UserProfileUpdateRequest(
        String nickname,
        String profileImageUrl,
        Integer birthYear,
        Gender gender,
        List<Long> tasteData
) {
}
