package com.almaeng.domain.review.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class ReviewCreateRequest {
    @NotNull(message = "별점은 필수입니다.")
    @Min(value = 1, message = "별점은 최소 1점 이상이어야 합니다.")
    @Max(value = 5, message = "별점은 최대 5점 이하여야 합니다.")
    private Integer rating;

    private String content; // null 허용 (별점만 있는 리뷰 가능)

    @NotNull(message = "스포일러 여부를 선택해주세요.")
    private Boolean spoiler;
}
