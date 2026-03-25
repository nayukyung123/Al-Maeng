package com.almaeng.domain.content.repository;

import com.almaeng.domain.content.entity.TopContent;
import com.almaeng.domain.content.dto.BannerResponse;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface TopContentRepository extends JpaRepository<TopContent, Long> {
    @Query("SELECT new com.almaeng.domain.content.dto.BannerResponse(c.id, c.title, c.bannerPosterUrl, t.rank, t.type) " +
            "FROM TopContent t JOIN t.content c " +
            "ORDER BY t.rank ASC")
    List<BannerResponse> findTopBanners();
}