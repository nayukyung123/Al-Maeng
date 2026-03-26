package com.almaeng.domain.ticket.dto;

import com.almaeng.domain.book.entity.Book;
import com.almaeng.domain.genre.entity.Genre;
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
        StyleData styleData,
        String genreName
) {
    public static TicketResponse from(Ticket ticket) {
        Book book = ticket.getCompletedBook().getBook();

        String topLevelGenreName = "미분류";
        if (book.getBookGenres() != null && !book.getBookGenres().isEmpty()) {
            Genre currentGenre = book.getBookGenres().get(0).getGenre();
            while (currentGenre.getParent() != null) {
                currentGenre = currentGenre.getParent();
            }
            topLevelGenreName = currentGenre.getName();
        }

        return new TicketResponse(
                ticket.getId(),
                ticket.getCompletedBook().getBook().getId(),
                ticket.getCompletedBook().getBook().getTitle(),
                ticket.getCompletedBook().getBook().getAuthor(),
                ticket.getCompletedBook().getBook().getCoverImageUrl(),
                ticket.getComment(),
                ticket.getCompletedBook().getCompletedAt(),
                ticket.getTicketImageUrl(),
                ticket.getStyleData(),
                topLevelGenreName
        );
    }
}
