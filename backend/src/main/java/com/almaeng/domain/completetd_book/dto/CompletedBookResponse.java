package com.almaeng.domain.completetd_book.dto;

import com.almaeng.domain.completetd_book.entity.CompletedBook;

import java.time.LocalDateTime;

public record CompletedBookResponse(
        Long completedBookId,
        Long bookId,
        String title,
        String author,
        String coverImageUrl,
        LocalDateTime completedAt,
        LocalDateTime createdAt
) {
    public static CompletedBookResponse from(CompletedBook completedBook) {
        return new CompletedBookResponse(
                completedBook.getId(),
                completedBook.getBook().getId(),
                completedBook.getBook().getTitle(),
                completedBook.getBook().getAuthor(),
                completedBook.getBook().getCoverImageUrl(),
                completedBook.getCompletedAt(),
                completedBook.getCreatedAt()
        );
    }
}
