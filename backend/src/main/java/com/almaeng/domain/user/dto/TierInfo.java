package com.almaeng.domain.user.dto;


// 마이페이지 티어/경험치 표시용 DTO
public record TierInfo(
        Integer id,
        String tierName,
        Integer minExp,     // 현재 티어 시작 경험치
        Integer nextMinExp, // 다음 티어 시작 경험치(없으면 null)
        Integer exp         // 현재 경험치(완독 권수 기반)
) {
}

