package com.almaeng.domain.recommendation.controller;

import com.almaeng.domain.recommendation.dto.ContentRecommendationResponse;
import com.almaeng.domain.recommendation.dto.TodayCurationResponse;
import com.almaeng.domain.recommendation.service.RecommendationService;
import com.almaeng.domain.recommendation.service.TodayCurationService;
import com.almaeng.global.common.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/recommendations")
@RequiredArgsConstructor
public class RecommendationController {

    private final RecommendationService recommendationService;
    private final TodayCurationService todayCurationService;

    // 취향 기반 도서 추천
    @GetMapping("/contents")
    public ResponseEntity<ApiResponse<List<ContentRecommendationResponse>>> getContentRecommendations() {
        return ResponseEntity.ok(ApiResponse.success(recommendationService.getContentRecommendations()));
    }

    // 오늘의 도서 추천
    @GetMapping("/today")
    public ResponseEntity<ApiResponse<TodayCurationResponse>> getTodayCuration(
            @AuthenticationPrincipal Long userId) {

        TodayCurationResponse response = todayCurationService.getTodayCuration(userId);

        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
