package com.almaeng.domain.ticket.dto;

import com.almaeng.domain.ticket.entity.Ticket;
import com.almaeng.domain.ticket.vo.StyleData;

import java.time.LocalDateTime;

public record TicketResponse(
        Long id,
        Long bookId,
        String title,
        String author,
        String coverImageUrl,
        String comment,
        LocalDateTime completedAt,
        String ticketImageUrl,
        StyleData styleData
) {
    public static TicketResponse from(Ticket ticket) {
        return new TicketResponse(
                ticket.getId(),
                ticket.getCompletedBook().getBook().getId(),
                ticket.getCompletedBook().getBook().getTitle(),
                ticket.getCompletedBook().getBook().getAuthor(),
                ticket.getCompletedBook().getBook().getCoverImageUrl(),
                ticket.getComment(),
                ticket.getCompletedBook().getCreatedAt(),
                ticket.getTicketImageUrl(),
                ticket.getStyleData()
        );
    }
}
