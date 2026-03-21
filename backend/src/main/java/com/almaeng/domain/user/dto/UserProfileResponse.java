package com.almaeng.domain.user.dto;

import java.util.List;

public record UserProfileResponse(
        String nickname,
        String profileImageUrl,
        Integer birthYear,
        Integer gender,
        List<Long> tastData
) {}
