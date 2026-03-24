package com.almaeng.domain.recommendation.controller;

import com.almaeng.domain.recommendation.dto.ContentRecommendationResponse;
import com.almaeng.domain.recommendation.service.RecommendationService;
import com.almaeng.global.common.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/recommendations")
@RequiredArgsConstructor
public class RecommendationController {

    private final RecommendationService recommendationService;

    @GetMapping("/contents")
    public ResponseEntity<ApiResponse<List<ContentRecommendationResponse>>> getContentRecommendations() {
        return ResponseEntity.ok(ApiResponse.success(recommendationService.getContentRecommendations()));
    }
}
