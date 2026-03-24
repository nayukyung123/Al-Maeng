package com.almaeng.domain.completedbook.controller;

import com.almaeng.domain.completedbook.dto.CompletedBookAddRequest;
import com.almaeng.domain.completedbook.dto.CompletedBookResponse;
import com.almaeng.domain.completedbook.service.CompletedBookService;
import com.almaeng.global.common.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/completed-books")
@RequiredArgsConstructor
public class CompletedBookController {
    private final CompletedBookService completedBookService;

    // 완독 도서 추가
    @PostMapping
    public ApiResponse<Void> addCompletedBook(@AuthenticationPrincipal Long userId,
                                              @Valid @RequestBody CompletedBookAddRequest request) {
        completedBookService.addCompletedBook(userId, request);

        return ApiResponse.success();
    }

    // 완독 도서 목록 조회
    @GetMapping
    public ApiResponse<List<CompletedBookResponse>> getCompletedBooks(@AuthenticationPrincipal Long userId,
                                                                      @RequestParam(defaultValue = "completedAt") String sortBy,
                                                                      @RequestParam(defaultValue = "desc") String sortOrder) {
        Sort.Direction sortDirection = sortOrder.equalsIgnoreCase("asc") ? Sort.Direction.ASC : Sort.Direction.DESC;
        Sort sort = Sort.by(sortDirection, sortBy);

        List<CompletedBookResponse> completedBooks = completedBookService.getCompletedBooks(userId, sort);

        return ApiResponse.success(completedBooks);
    }

    // 완독 도서 삭제
    @DeleteMapping("/{bookId}")
    public ApiResponse<Void> deleteCompletedBook(@AuthenticationPrincipal Long userId,
                                                 @PathVariable Long bookId) {
        completedBookService.deleteCompletedBook(userId, bookId);

        return ApiResponse.success();
    }
}
