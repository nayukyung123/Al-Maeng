package com.almaeng.domain.search.controller;

import com.almaeng.domain.content.dto.ContentResponse;
import com.almaeng.domain.content.dto.ContentSuggestionResponse;
import com.almaeng.domain.search.service.ContentSearchService;
import com.almaeng.global.common.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springdoc.core.annotations.ParameterObject;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Slice;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/contents")
@RequiredArgsConstructor
public class ContentSearchController {

    private final ContentSearchService contentSearchService;

    // 영상 검색 자동완성
    @GetMapping("/suggestions")
    public ResponseEntity<ApiResponse<List<ContentSuggestionResponse>>> getSuggestions(
            @RequestParam("keyword") String keyword) {

        List<ContentSuggestionResponse> response = contentSearchService.getContentSuggestions(keyword);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    // 영상 검색 결과
    @GetMapping
    public ResponseEntity<ApiResponse<Slice<ContentResponse>>> searchContents(
            @RequestParam("keyword") String keyword,
            // 도서와 동일하게 id 역순 임시 정렬
            @ParameterObject @PageableDefault(size = 10, sort = "id", direction = Sort.Direction.DESC) Pageable pageable) {

        return ResponseEntity.ok(ApiResponse.success(contentSearchService.searchContents(keyword, pageable)));
    }
}
