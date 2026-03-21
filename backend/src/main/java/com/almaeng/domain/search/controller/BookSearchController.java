package com.almaeng.domain.search.controller;

import com.almaeng.domain.book.dto.BookResponse;
import com.almaeng.domain.book.dto.BookSuggestionResponse;
import com.almaeng.domain.search.service.BookSearchService;
import com.almaeng.domain.search.service.SearchRankingService;
import com.almaeng.global.common.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springdoc.core.annotations.ParameterObject;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Slice;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequiredArgsConstructor
public class BookSearchController {

    private final BookSearchService booksearchService;
    private final SearchRankingService searchRankingService;

    // 도서 검색 자동완성
    @GetMapping("/api/books/suggestions")
    public ResponseEntity<ApiResponse<List<BookSuggestionResponse>>> getSuggestions(
            @RequestParam("keyword") String keyword){

        List<BookSuggestionResponse> response = booksearchService.getSuggestions(keyword);

        return ResponseEntity.ok(ApiResponse.success(response));
    }

    // 도서 검색 결과
    @GetMapping("/api/books")
    public ResponseEntity<ApiResponse<Slice<BookResponse>>> searchBooks(
            @RequestParam("keyword") String keyword,
            @ParameterObject @PageableDefault(size=10, sort = "id", direction = Sort.Direction.DESC) Pageable pageable){
        
        // 실시간 검색어 제공을 위한 Redis 업데이트
        searchRankingService.incrementSearchKeyword(keyword);

        return ResponseEntity.ok(ApiResponse.success(booksearchService.searchBooks(keyword, pageable)));
    }

}
