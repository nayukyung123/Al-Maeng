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
        Double averageRating,
        String purchaseUrl

) {
    public static BookDetailResponse from(Book book) {
        String genreName = "미분류";
        if (book.getBookGenres() != null && !book.getBookGenres().isEmpty()) {
            genreName = book.getBookGenres().get(0).getGenre().getName();
        }

        // 알라딘 구매 링크 생성
        String purchaseUrl = "https://www.aladin.co.kr";
        if (book.getIsbn() != null && !book.getIsbn().isEmpty()) {
            purchaseUrl = "https://www.aladin.co.kr/shop/wproduct.aspx?ISBN=" + book.getIsbn();
        } else if (book.getTitle() != null) {
            try {
                purchaseUrl = "https://www.aladin.co.kr/search/wsearchresult.aspx?SearchTarget=All&SearchWord="
                        + java.net.URLEncoder.encode(book.getTitle(), java.nio.charset.StandardCharsets.UTF_8.toString());
            } catch (Exception e) {
            }
        }

        return new BookDetailResponse(
                book.getId(),
                book.getSlug(),
                book.getTitle(),
                book.getAuthor(),
                genreName,
                book.getDescription(),
                book.getCoverImageUrl(),
                book.getAverageRating(),
                purchaseUrl
        );
    }
}