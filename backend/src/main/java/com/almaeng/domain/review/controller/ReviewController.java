package com.almaeng.domain.review.controller;

import com.almaeng.domain.review.dto.ReviewCreateRequest;
import com.almaeng.domain.review.dto.ReviewResponse;
import com.almaeng.domain.review.service.ReviewService;
import com.almaeng.domain.review.type.ReviewSortType;
import com.almaeng.global.common.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Slice;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping
@RequiredArgsConstructor
public class ReviewController {

    private final ReviewService reviewService;

    @PostMapping("/{slug}/review")
    public ResponseEntity<ApiResponse<Long>> createReview(
            @RequestParam Long userId,
            @PathVariable String slug,
            @Valid @RequestBody ReviewCreateRequest request){

        Long reviewId = reviewService.createReview(userId, slug, request);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(reviewId));
    }

    @GetMapping("/{slug}/review")
    public ResponseEntity<ApiResponse<Slice<ReviewResponse>>> getReviews(
            @PathVariable String slug,
            @RequestParam(defaultValue = "false") boolean excludeSpoiler,
            @RequestParam(defaultValue = "LATEST")ReviewSortType sortType,
            @PageableDefault(size = 10) Pageable pageable){

        Slice<ReviewResponse> reviews = reviewService.getReviewList(slug, excludeSpoiler, sortType, pageable);

        return ResponseEntity.ok(ApiResponse.success(reviews));
    }
}
