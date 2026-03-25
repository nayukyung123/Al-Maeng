package com.almaeng.domain.book.dto;

import com.almaeng.domain.book.entity.Book;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BookResponse {
    private Long id;
    private String slug;
    private String title;
    private String author;
    private String coverImageUrl;

    public static BookResponse from(Book book) {
        return BookResponse.builder()
                .id(book.getId())
                .slug(book.getSlug())
                .title(book.getTitle())
                .author(book.getAuthor())
                .coverImageUrl(book.getCoverImageUrl())
                .build();
    }
}
