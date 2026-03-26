package com.almaeng.domain.completedbook.dto;

import com.almaeng.domain.book.entity.Book;
import com.almaeng.domain.completedbook.entity.CompletedBook;
import com.almaeng.domain.genre.entity.Genre;

import java.time.LocalDateTime;

public record CompletedBookResponse(
        Long completedBookId,
        Long bookId,
        String slug,
        String title,
        String author,
        String coverImageUrl,
        String genreName,
        LocalDateTime completedAt,
        LocalDateTime createdAt
) {
    public static CompletedBookResponse from(CompletedBook completedBook) {
        Book book = completedBook.getBook();

        String topLevelGenreName = "미분류";
        if (book.getBookGenres() != null && !book.getBookGenres().isEmpty()) {
            Genre currentGenre = book.getBookGenres().get(0).getGenre();

            while (currentGenre.getParent() != null) {
                currentGenre = currentGenre.getParent();
            }
            topLevelGenreName = currentGenre.getName();
        }

        return new CompletedBookResponse(
                completedBook.getId(),
                completedBook.getBook().getId(),
                completedBook.getBook().getSlug(),
                completedBook.getBook().getTitle(),
                completedBook.getBook().getAuthor(),
                completedBook.getBook().getCoverImageUrl(),
                topLevelGenreName,
                completedBook.getCompletedAt(),
                completedBook.getCreatedAt()
        );
    }
}
