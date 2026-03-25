package com.almaeng.domain.ticket.dto;

import com.almaeng.domain.ticket.vo.StyleData;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDateTime;

public record TicketCreateRequest(
        @NotNull(message = "도서 ID는 필수입니다.")
        Long bookId,
        @NotNull(message = "완독 일자는 필수입니다.")
        LocalDateTime completedAt,
        String comment,
        String ticketImageUrl,
        StyleData styleData
) {
}
