package com.almaeng.domain.ticket.dto;

import com.almaeng.domain.ticket.vo.StyleData;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;

public record TicketCreateRequest(
        @NotNull(message = "도서 ID는 필수입니다.")
        Long bookId,
        @NotNull(message = "완독 일자는 필수입니다.")
        LocalDateTime completedAt,
        @Size(max = 50, message = "한줄평은 50자 이하여야 합니다.")
        String comment,
        String ticketImageUrl,
        StyleData styleData
) {
}
