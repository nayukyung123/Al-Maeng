package com.almaeng.domain.book.dto;

import com.almaeng.domain.book.entity.Book;
public record BookDetailResponse(
        String slug,
        String title,
        String author,
        String description,
        String coverImageUrl,
        Double averageRating

) {
    public static BookDetailResponse from(Book book) {
        return new BookDetailResponse(
                book.getSlug(),
                book.getTitle(),
                book.getAuthor(),
                book.getDescription(),
                book.getCoverImageUrl(),
                book.getAverageRating()
        );
    }
}