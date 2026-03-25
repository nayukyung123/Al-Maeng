package com.almaeng.domain.search.controller;

import com.almaeng.domain.content.dto.ContentResponse;
import com.almaeng.domain.content.dto.ContentSuggestionResponse;
import com.almaeng.domain.search.service.ContentSearchService;
import com.almaeng.global.common.ApiResponse;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.RequiredArgsConstructor;
import org.springdoc.core.annotations.ParameterObject;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Slice;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/contents")
@RequiredArgsConstructor
@Validated
public class ContentSearchController {

    private final ContentSearchService contentSearchService;

    // 영상 검색 자동완성
    @GetMapping("/suggestions")
    public ResponseEntity<ApiResponse<List<ContentSuggestionResponse>>> getSuggestions(
            @RequestParam("keyword")
            @NotBlank(message = "검색어를 입력해주세요.")
            @Size(min = 1, max = 50, message = "검색어는 1자 이상 50자 이하로 입력해주세요.") String keyword) {

        List<ContentSuggestionResponse> response = contentSearchService.getContentSuggestions(keyword);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    // 영상 검색 결과
    @GetMapping
    public ResponseEntity<ApiResponse<Slice<ContentResponse>>> searchContents(
            @RequestParam("keyword")
            @NotBlank(message = "검색어를 입력해주세요.")
            @Size(min = 1, max = 50, message = "검색어는 1자 이상 50자 이하로 입력해주세요.") String keyword,
            @RequestParam(value = "sortType", defaultValue = "accuracy") String sortType,
            @ParameterObject @PageableDefault(size = 10) Pageable pageable) {

        return ResponseEntity.ok(ApiResponse.success(contentSearchService.searchContents(keyword, sortType, pageable)));
    }
}
