package com.almaeng.domain.search.controller;

import com.almaeng.domain.book.dto.BookResponse;
import com.almaeng.domain.book.dto.BookSuggestionResponse;
import com.almaeng.domain.search.service.BookSearchService;
import com.almaeng.domain.search.service.SearchRankingService;
import com.almaeng.global.common.ApiResponse;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.RequiredArgsConstructor;
import org.springdoc.core.annotations.ParameterObject;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Slice;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequiredArgsConstructor
@Validated
public class BookSearchController {

    private final BookSearchService booksearchService;
    private final SearchRankingService searchRankingService;

    // 도서 검색 자동완성
    @GetMapping("/api/books/suggestions")
    public ResponseEntity<ApiResponse<List<BookSuggestionResponse>>> getSuggestions(
            @RequestParam("keyword")
            @NotBlank(message = "검색어를 입력해주세요.")
            @Size(min = 1, max = 50, message = "검색어는 1자 이상 50자 이하로 입력해주세요.") String keyword){

        List<BookSuggestionResponse> response = booksearchService.getSuggestions(keyword);

        return ResponseEntity.ok(ApiResponse.success(response));
    }

    // 도서 검색 결과
    @GetMapping("/api/books")
    public ResponseEntity<ApiResponse<Slice<BookResponse>>> searchBooks(
            @RequestParam("keyword")
            @NotBlank(message = "검색어를 입력해주세요.")
            @Size(min = 1, max = 50, message = "검색어는 1자 이상 50자 이하로 입력해주세요.") String keyword,
            @ParameterObject @PageableDefault(size=10, sort = "id", direction = Sort.Direction.DESC) Pageable pageable){
        
        // 실시간 검색어 제공을 위한 Redis 업데이트
        searchRankingService.incrementSearchKeyword(keyword);

        return ResponseEntity.ok(ApiResponse.success(booksearchService.searchBooks(keyword, pageable)));
    }

}
