package com.almaeng.domain.book.controller;

import com.almaeng.domain.book.dto.BookResponse;
import com.almaeng.domain.book.service.BookRankingService;
import com.almaeng.domain.book.service.BookService;
import com.almaeng.domain.book.type.RankingPeriod;
import com.almaeng.domain.book.type.RankingType;
import com.almaeng.global.common.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/books")
@RequiredArgsConstructor
public class BookController {

    private final BookRankingService bookRankingService;
    private final BookService bookService;

    @GetMapping("/rankings")
    public ResponseEntity<ApiResponse<List<BookResponse>>> getBookRankings(
            @RequestParam(defaultValue = "ALL_TIME")RankingPeriod period,
            @RequestParam(defaultValue = "VIEW")RankingType type){

        List<BookResponse> rankings = bookRankingService.getBookRankings(period, type);
        return ResponseEntity.ok(ApiResponse.success(rankings));
    }

    @GetMapping("/{slug}/recommendations")
    public ResponseEntity<ApiResponse<List<BookResponse>>> getSimilarBooks(@PathVariable String slug) {
        return ResponseEntity.ok(ApiResponse.success(bookService.getSimilarBooks(slug)));
    }
}
