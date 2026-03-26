package com.almaeng.domain.ticket.dto;

public record PresignedUrlResponse(
        String presignedUrl,
        String imageUrl,
        /** Presigned PUT 시 반드시 동일한 값으로 Content-Type 헤더를 보내야 함 (서명 불일치 시 403) */
        String contentType
) {
}
