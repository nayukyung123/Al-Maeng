package com.almaeng.domain.content.dto;

import com.almaeng.domain.content.entity.Content;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class ContentResponse {
    private Long id;
    private String title;
    private String type;
    private String posterUrl;

    public static ContentResponse from(Content content) {
        return ContentResponse.builder()
                .id(content.getId())
                .title(content.getTitle())
                .type(content.getType())
                .posterUrl(content.getPosterUrl())
                .build();
    }
}
