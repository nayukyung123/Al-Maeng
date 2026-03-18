package com.almaeng.domain.search.controller;

import com.almaeng.domain.book.dto.BookResponse;
import com.almaeng.domain.book.dto.BookSuggestionResponse;
import com.almaeng.domain.search.service.SearchService;
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
@RequestMapping("/api/books")
@RequiredArgsConstructor
public class BookSearchController {

    private final SearchService searchService;

    // 도서 검색 자동완성
    @GetMapping("/suggestions")
    public ResponseEntity<ApiResponse<List<BookSuggestionResponse>>> getSuggestions(
            @RequestParam("keyword") String keyword){

        List<BookSuggestionResponse> response = searchService.getSuggestions(keyword);

        return ResponseEntity.ok(ApiResponse.success(response));
    }

    // 도서 검색 결과
    @GetMapping
    public ResponseEntity<ApiResponse<Slice<BookResponse>>> searchBooks(
            @RequestParam("keyword") String keyword,
            @ParameterObject @PageableDefault(size=10, sort = "id", direction = Sort.Direction.DESC) Pageable pageable){
        return ResponseEntity.ok(ApiResponse.success(searchService.searchBooks(keyword, pageable)));
    }

}
