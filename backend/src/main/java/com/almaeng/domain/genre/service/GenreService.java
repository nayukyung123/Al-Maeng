package com.almaeng.domain.genre.service;

import com.almaeng.domain.genre.dto.GenreResponse;
import com.almaeng.domain.genre.repository.GenreRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class GenreService {
    private final GenreRepository genreRepository;

    // 사용자가 선택 가능한 전체 장르 목록 조회
    @Transactional(readOnly = true)
    public List<GenreResponse> getSelectableGenres() {
        return genreRepository.findAllByIsSelectableTrue().stream()
                .map(GenreResponse::from)
                .toList();
    }
}
