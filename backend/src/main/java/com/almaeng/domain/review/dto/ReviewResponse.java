package com.almaeng.domain.review.dto;

import com.almaeng.domain.review.entity.Review;
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

    public static ReviewResponse from(Review r) {
        return new ReviewResponse(
                r.getId(),
                r.getUser().getId(),
                r.getUser().getNickname(),
                r.getUser().getTier().getTierName(),
                r.getUser().getProfileImageUrl(),
                r.getRating(),
                r.getContent(),
                r.getSpoiler(),
                r.getCreatedAt()
        );
    }
}
