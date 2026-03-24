package com.almaeng.domain.recommendation.service;

import com.almaeng.domain.content.entity.Content;
import com.almaeng.domain.content.entity.Tag;
import com.almaeng.domain.content.repository.ContentRepository;
import com.almaeng.domain.content.repository.TagRepository;
import com.almaeng.domain.recommendation.dto.ContentRecommendationResponse;
import com.almaeng.domain.recommendation.dto.CurationRequest;
import com.almaeng.domain.recommendation.dto.CurationResponse;
import com.almaeng.domain.recommendation.entity.TagBookRecommendation;
import com.almaeng.domain.recommendation.repository.TagBookRecommendationRepository;
import com.almaeng.domain.recommendation.type.LengthType;
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
    private final TagRepository tagRepository;

    // 인기 컨텐츠 기반 도서 추천
    public List<ContentRecommendationResponse> getContentRecommendations() {
        // 데이터 가져오기 (영화 3개 + TV 3개)
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

    // 취향 찾기 큐레이션
    public List<CurationResponse> getCurations(CurationRequest request) {

        // 영상에 매핑된 태그 조회
        List<Tag> tags = tagRepository.findByContentId(request.getContentId());

        if(tags.isEmpty()) {
            log.warn("컨텐츠 ID [{}]에 등록된 태그가 없습니다.", request.getContentId());
            return Collections.emptyList();
        }

        // 태그별 도서 조회 후 반환
        return tags.stream()
                .map(tag -> createCurationResponse(tag, request.getBookLength()))
                // 해당 분량의 책이 1권도 없는 태그는 제외
                .filter(response -> !response.getBooks().isEmpty())
                .toList();
    }

    private CurationResponse createCurationResponse(Tag tag, LengthType bookLength) {

        // 태그 + 분량(LengthType) 조건으로 상위 3권 조회
        List<TagBookRecommendation> recos = tagRecommendationRepository
                .findTop3ByTagIdAndLengthTypeOrderByScoreDesc(tag.getId(), bookLength);

        return CurationResponse.builder()
                .tagId(tag.getId())
                .tagName(tag.getTagName())
                .books(recos.stream()
                        .map(CurationResponse.BookInfo::from)
                        .toList())
                .build();
    }

}
