package com.almaeng.domain.book.dto;

import com.almaeng.domain.book.entity.Book;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class BookSuggestionResponse {

    private Long bookId;
    private String title;
    private String author;

    public static BookSuggestionResponse from(Book book) {
        return BookSuggestionResponse.builder()
                .bookId(book.getId())
                .title(book.getTitle())
                .author(book.getAuthor())
                .build();
    }
}
