package com.almaeng.domain.review.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@AllArgsConstructor
public class ReviewResponse {
    private Long id;
    private Long userId;
    private String nickname;
    private String tierName;
    private String profileImageUrl;
    private Integer rating;
    private String content;
    private Boolean spoiler;
    private LocalDateTime createdAt;
}
