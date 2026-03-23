package com.almaeng.domain.genre.controller;

import com.almaeng.domain.genre.dto.GenreResponse;
import com.almaeng.domain.genre.service.GenreService;
import com.almaeng.global.common.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/genres")
@RequiredArgsConstructor
public class GenreController {
    private final GenreService genreService;

    // 선택 가능한 취향 장르 목록 조회
    @GetMapping
    public ApiResponse<List<GenreResponse>> getGenres() {
        List<GenreResponse> response = genreService.getSelectableGenres();

        return ApiResponse.success(response);
    }
}
