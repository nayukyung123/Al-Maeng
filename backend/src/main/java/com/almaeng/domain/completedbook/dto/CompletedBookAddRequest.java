package com.almaeng.domain.completedbook.dto;

import jakarta.validation.constraints.NotNull;

public record CompletedBookAddRequest(
        @NotNull(message = "도서 ID는 필수입니다.")
        Long bookId
) {
}
