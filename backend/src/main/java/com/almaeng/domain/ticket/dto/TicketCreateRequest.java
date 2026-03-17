package com.almaeng.domain.ticket.dto;

import java.time.LocalDateTime;

public record TicketCreateRequest(
        Long bookId,
        LocalDateTime completedAt,
        String comment,
        String ticketImageUrl
) {
}
