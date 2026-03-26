package com.almaeng.domain.book.dto;

import com.almaeng.domain.book.entity.Book;
public record BookDetailResponse(
        Long id,
        String slug,
        String title,
        String author,
        String genre,
        String description,
        String coverImageUrl,
        Double averageRating

) {
    public static BookDetailResponse from(Book book) {
        String genreName = "미분류";
        if (book.getBookGenres() != null && !book.getBookGenres().isEmpty()) {
            genreName = book.getBookGenres().get(0).getGenre().getName();
        }

        return new BookDetailResponse(
                book.getId(),
                book.getSlug(),
                book.getTitle(),
                book.getAuthor(),
                genreName,
                book.getDescription(),
                book.getCoverImageUrl(),
                book.getAverageRating()
        );
    }
}