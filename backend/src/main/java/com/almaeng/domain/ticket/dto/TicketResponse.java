package com.almaeng.domain.ticket.dto;

import com.almaeng.domain.ticket.entity.Ticket;

public record TicketResponse(
        Long id,
        String title,
        String author,
        String coverImageUrl,
        String comment,
        java.time.LocalDateTime completedAt,
        String ticketImageUrl
) {
    public static TicketResponse from(Ticket ticket) {
        return new TicketResponse(
                ticket.getId(),
                ticket.getCompletedBook().getBook().getTitle(),
                ticket.getCompletedBook().getBook().getAuthor(),
                ticket.getCompletedBook().getBook().getCoverImageUrl(),
                ticket.getComment(),
                ticket.getCompletedBook().getCreatedAt(),
                ticket.getTicketImageUrl()
        );
    }
}
