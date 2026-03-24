package com.almaeng.domain.recommendation.dto;

import com.almaeng.domain.recommendation.entity.TagBookRecommendation;
import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
public class CurationResponse {
    private Long tagId;
    private String tagName;

    private List<BookInfo> books;

    @Getter
    @Builder
    public static class BookInfo {
        private Long bookId;
        private String title;
        private String author;
        private String coverImageUrl;
        private String slug;

        public static BookInfo from(TagBookRecommendation reco) {
            return BookInfo.builder()
                    .bookId(reco.getBook().getId())
                    .title(reco.getBook().getTitle())
                    .author(reco.getBook().getAuthor())
                    .coverImageUrl(reco.getBook().getCoverImageUrl())
                    .slug(reco.getBook().getSlug())
                    .build();
        }
    }
}
