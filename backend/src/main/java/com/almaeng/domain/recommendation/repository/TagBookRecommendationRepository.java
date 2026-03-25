package com.almaeng.domain.recommendation.repository;

import com.almaeng.domain.recommendation.entity.TagBookRecommendation;
import com.almaeng.domain.recommendation.type.LengthType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface TagBookRecommendationRepository extends JpaRepository<TagBookRecommendation, Long> {

    // 인기 컨텐츠 — 태그별 rank=1 & MEDIUM 도서 1권씩 (컨텐츠당 총 3권)
    @Query("SELECT tbr FROM TagBookRecommendation tbr " +
            "JOIN FETCH tbr.book " +
            "WHERE tbr.tag.content.id = :contentId " +
            "AND tbr.rank = 1 " +
            "AND tbr.lengthType = com.almaeng.domain.recommendation.type.LengthType.MEDIUM")
    List<TagBookRecommendation> findTopByContentId(@Param("contentId") Long contentId);

    // 태그와 분량 기준 상위 3건
    List<TagBookRecommendation> findTop3ByTagIdAndLengthTypeOrderByScoreDesc(Long tagId, LengthType lengthType);

}
