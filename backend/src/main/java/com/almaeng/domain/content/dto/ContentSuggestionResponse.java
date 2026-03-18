package com.almaeng.domain.content.dto;

import com.almaeng.domain.content.entity.Content;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class ContentSuggestionResponse {
    private Long id;
    private String title;

    public static ContentSuggestionResponse from(Content content) {
        return ContentSuggestionResponse.builder()
                .id(content.getId())
                .title(content.getTitle())
                .build();
    }
}
