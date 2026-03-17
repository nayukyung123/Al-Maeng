package com.almaeng.domain.search.controller;

import com.almaeng.domain.book.dto.BookSuggestionResponse;
import com.almaeng.domain.search.service.SearchService;
import com.almaeng.global.common.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/books")
@RequiredArgsConstructor
public class SearchController {

    private final SearchService searchService;

    @GetMapping("/suggestions")
    public ResponseEntity<ApiResponse<List<BookSuggestionResponse>>> getSuggestions(@RequestParam("keyword") String keyword){

        List<BookSuggestionResponse> response = searchService.getSuggestions(keyword);

        return ResponseEntity.ok(ApiResponse.success(response));
    }

}
