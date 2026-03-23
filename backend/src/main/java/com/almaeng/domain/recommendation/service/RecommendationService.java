package com.almaeng.domain.recommendation.service;

import com.almaeng.domain.content.entity.Content;
import com.almaeng.domain.content.repository.ContentRepository;
import com.almaeng.domain.recommendation.dto.ContentRecommendationResponse;
import com.almaeng.domain.recommendation.entity.TagBookRecommendation;
import com.almaeng.domain.recommendation.repository.TagBookRecommendationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.List;
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class RecommendationService {

    private final ContentRepository contentRepository;
    private final TagBookRecommendationRepository tagRecommendationRepository;

    // 인기 컨텐츠 기반 도서 추천
    public List<ContentRecommendationResponse> getContentRecommendations() {
        // 1. 데이터 가져오기 (영화 3개 + TV 3개)
        List<Content> topContents = contentRepository.findTopRankedContentsPerType();

        if (topContents.isEmpty()) {
            log.warn("인기 컨텐츠(top_contents) 데이터가 없습니다. 빈 리스트를 반환합니다.");
            return Collections.emptyList();
        }

        return topContents.stream().map(content -> {
            List<TagBookRecommendation> recoList =
                    tagRecommendationRepository.findTopByContentId(content.getId());

            if (recoList.isEmpty()) {
                log.error("Data Inconsistency: 컨텐츠 ID [{}] 에 매핑된 추천 도서가 없습니다.", content.getId());
            }

            return ContentRecommendationResponse.builder()
                    .content(ContentRecommendationResponse.from(content))
                    .recommendedBooks(recoList.stream()
                            .limit(3)
                            .map(ContentRecommendationResponse::from)
                            .toList())
                    .build();
        })
                .filter(res -> !res.getRecommendedBooks().isEmpty())
                .toList();
    }

}
