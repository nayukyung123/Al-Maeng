package com.almaeng.domain.book.repository;

import com.almaeng.domain.book.entity.Ranking;
import io.lettuce.core.dynamic.annotation.Param;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RankingRepository extends JpaRepository<Ranking, Long> {

    // DB FAllback 조회 (Redis 캐시 미스 시 호출)
    @EntityGraph(attributePaths = {"book"})
    List<Ranking> findByRankCategoryOrderByRankAsc(String rankCategory);

    // 스케줄러 Batch - 기존 랭킹 초기화
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("DELETE FROM Ranking r WHERE r.rankCategory = :category")
    void deleteAllByRankCategoryBulk(@Param("category") String category);
}
