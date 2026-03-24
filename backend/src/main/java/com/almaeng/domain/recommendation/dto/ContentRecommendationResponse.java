package com.almaeng.domain.recommendation.dto;

import com.almaeng.domain.book.entity.Book;
import com.almaeng.domain.content.entity.Content;
import com.almaeng.domain.recommendation.entity.TagBookRecommendation;
import com.almaeng.domain.recommendation.type.LengthType;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.util.List;

@Getter
@Builder
public class ContentRecommendationResponse {

    private ContentResponse content;
    private List<RecommendedBookResponse> recommendedBooks;

    @Getter @Builder
    public static class ContentResponse {
        private Long id;
        private String title;
        private String posterUrl;
        private String description;
        private String type;
    }

    @Getter @Builder
    public static class RecommendedBookResponse {
        private Long id;
        private String title;
        private String author;
        private String slug;
        private String coverImageUrl;
        private Integer pageCount;
        private LengthType lengthType;
        private BigDecimal score;
    }

    public static ContentResponse from(Content content) {
        return ContentResponse.builder()
                .id(content.getId())
                .title(content.getTitle())
                .posterUrl(content.getPosterUrl())
                .description(content.getDescription())
                .type(content.getType())
                .build();
    }

    public static RecommendedBookResponse from(TagBookRecommendation reco) {
        Book book = reco.getBook();
        return RecommendedBookResponse.builder()
                .id(book.getId())
                .title(book.getTitle())
                .author(book.getAuthor())
                .slug(book.getSlug())
                .coverImageUrl(book.getCoverImageUrl())
                .pageCount(book.getPageCount())
                .lengthType(reco.getLengthType())
                .score(reco.getScore())
                .build();
    }

}
