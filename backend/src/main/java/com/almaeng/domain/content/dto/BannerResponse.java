package com.almaeng.domain.content.dto;

public record BannerResponse(
        Long contentId,
        String title,
        String bannerPosterUrl,
        Integer rank,
        String type
) {}