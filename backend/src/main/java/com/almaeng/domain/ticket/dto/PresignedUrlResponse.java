package com.almaeng.domain.ticket.dto;

public record PresignedUrlResponse(
        String presignedUrl,
        String imageUrl
) {
}
