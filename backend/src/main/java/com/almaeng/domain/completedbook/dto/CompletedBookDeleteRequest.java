package com.almaeng.domain.completedbook.dto;

import jakarta.validation.constraints.NotBlank;

public record CompletedBookDeleteRequest(
        @NotBlank(message = "유입 출처(source)는 필수입니다.")
        String source
) {
}
