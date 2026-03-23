package com.almaeng.domain.recommendation.service;

import com.almaeng.domain.content.entity.Content;
import com.almaeng.domain.content.repository.ContentRepository;
import com.almaeng.domain.recommendation.dto.ContentRecommendationResponse;
import com.almaeng.domain.recommendation.entity.TagBookRecommendation;
import com.almaeng.domain.recommendation.repository.TagBookRecommendationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class RecommendationService {

    private final ContentRepository contentRepository;
    private final TagBookRecommendationRepository tagRecommendationRepository;

    public List<ContentRecommendationResponse> getContentRecommendations() {
        // 1. 데이터 가져오기 (영화 3개 + TV 3개)
        List<Content> topContents = contentRepository.findTopRankedContentsPerType();

        return topContents.stream().map(content -> {
            List<TagBookRecommendation> recoList =
                    tagRecommendationRepository.findTopByContentId(content.getId());

            return ContentRecommendationResponse.builder()
                    .content(ContentRecommendationResponse.from(content))
                    .recommendedBooks(recoList.stream()
                            .limit(3)
                            .map(ContentRecommendationResponse::from)
                            .toList())
                    .build();
        }).toList();
    }

}
