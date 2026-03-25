package com.almaeng.domain.recommendation.repository;

import com.almaeng.domain.recommendation.entity.UserRecommendationPool;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface UserRecommendationPoolRepository extends JpaRepository<UserRecommendationPool, Long> {

    // 점수가 높은 순서대로 50권 조회 (Redis 스냅샷용)
    List<UserRecommendationPool> findTop50ByUserIdOrderByScoreDesc(Long userId);
}
