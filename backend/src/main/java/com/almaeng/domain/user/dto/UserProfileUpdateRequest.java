package com.almaeng.domain.user.dto;

import java.util.List;

public record UserProfileUpdateRequest(
        String nickname,
        String profileImageUrl,
        Integer birthYear,
        Integer gender,
        List<Long> tasteData
) {
}
