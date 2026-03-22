package com.almaeng.domain.search.service;

import com.almaeng.domain.content.dto.ContentResponse;
import com.almaeng.domain.content.dto.ContentSuggestionResponse;
import com.almaeng.domain.content.entity.Content;
import com.almaeng.domain.content.repository.ContentRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
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

        List<Content> contents = contentRepository.findTop5ByTitleContaining(keyword);

        return contents.stream()
                .map(ContentSuggestionResponse::from)
                .toList();
    }

    // 영상 검색 결과
    public Slice<ContentResponse> searchContents(String keyword, Pageable pageable) {
        String trimmedKeyword = (keyword != null) ? keyword.trim() : "";

        if (trimmedKeyword.isEmpty()) {
            return Page.empty();
        }

        return contentRepository.findByTitleContaining(trimmedKeyword, pageable)
                .map(ContentResponse::from);
    }
}
