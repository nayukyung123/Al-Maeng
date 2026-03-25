package com.almaeng.domain.search.service;

import com.almaeng.domain.content.dto.ContentResponse;
import com.almaeng.domain.content.dto.ContentSuggestionResponse;
import com.almaeng.domain.content.entity.Content;
import com.almaeng.domain.content.repository.ContentRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Slice;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class ContentSearchService {

    private final ContentRepository contentRepository;

    // 영상 검색 자동완성
    public List<ContentSuggestionResponse> getContentSuggestions(String keyword) {
        if (keyword == null || keyword.trim().isEmpty()) {
            return List.of();
        }

        // 검색어 전처리
        String processedKeyword = keyword.replaceAll("\\s+", "").toLowerCase();
        
        // 자동완성 5개 제한
        List<Content> contents = contentRepository.findSuggestionsByKeyword(processedKeyword, PageRequest.of(0, 5));

        return contents.stream()
                .map(ContentSuggestionResponse::from)
                .toList();
    }

    // 영상 검색 결과
    public Slice<ContentResponse> searchContents(String keyword, String sortType, Pageable pageable) {
        if (keyword == null || keyword.trim().isEmpty()) {
            return Page.empty();
        }

        // 검색어 전처리
        String processedKeyword = keyword.replaceAll("\\s+", "").toLowerCase();

        // 정렬 충돌방지
        Pageable cleanPageable = PageRequest.of(pageable.getPageNumber(), pageable.getPageSize());

        return contentRepository.searchContentsByKeyword(processedKeyword, sortType, cleanPageable)
                .map(ContentResponse::from);
    }
}
