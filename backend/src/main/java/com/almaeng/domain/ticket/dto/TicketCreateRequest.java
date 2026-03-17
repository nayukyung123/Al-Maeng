package com.almaeng.domain.ticket.dto;

public record TicketCreateRequest(
        Long bookId,
        String comment,
        String ticketImageUrl
) {
}
