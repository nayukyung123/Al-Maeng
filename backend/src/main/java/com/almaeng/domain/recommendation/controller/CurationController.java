package com.almaeng.domain.recommendation.controller;

import com.almaeng.domain.recommendation.dto.CurationRequest;
import com.almaeng.domain.recommendation.dto.CurationResponse;
import com.almaeng.domain.recommendation.service.RecommendationService;
import com.almaeng.global.common.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/curations")
@RequiredArgsConstructor
public class CurationController {

    private final RecommendationService recommendationService;

    @PostMapping
    public ResponseEntity<ApiResponse<List<CurationResponse>>> getCurations(
            @RequestBody CurationRequest request){
        return ResponseEntity.ok(ApiResponse.success(recommendationService.getCurations(request)));
    }
}
