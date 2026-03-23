package com.almaeng.domain.search.controller;

import com.almaeng.domain.search.service.SearchRankingService;
import com.almaeng.global.common.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/keywords")
@RequiredArgsConstructor
public class SearchRankingController {

    private final SearchRankingService searchRankingService;

    @GetMapping("/rankings")
    public ResponseEntity<ApiResponse<List<String>>> getRankings() {
        List<String> topRankings = searchRankingService.getTopRankings();

        return ResponseEntity.ok(ApiResponse.success(topRankings));
    }
}
