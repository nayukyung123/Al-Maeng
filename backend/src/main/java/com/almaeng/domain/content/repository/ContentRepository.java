package com.almaeng.domain.content.repository;

import com.almaeng.domain.content.entity.Content;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Slice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ContentRepository extends JpaRepository<Content, Long> {

    // 영상 검색 자동완성 (Top 5)
    @Query("SELECT c FROM Content c " +
            "WHERE LOWER(REPLACE(c.title, ' ', '')) LIKE CONCAT('%', :keyword, '%') " +
            "ORDER BY " +
            "  CASE WHEN LOWER(REPLACE(c.title, ' ', '')) = :keyword THEN 1 " + // 완전 일치
            "       WHEN LOWER(REPLACE(c.title, ' ', '')) LIKE CONCAT(:keyword, '%') THEN 2 " + // 전방 일치
            "       ELSE 3 END ASC, " +
            "  c.releaseDate DESC, c.id DESC")
    List<Content> findSuggestionsByKeyword(@Param("keyword") String keyword, Pageable pageable);

    // 영상 검색 결과
    @Query("SELECT c FROM Content c " +
            "WHERE LOWER(REPLACE(c.title, ' ', '')) LIKE CONCAT('%', :keyword, '%') " +
            "ORDER BY " +
            "  CASE WHEN :sortType = 'accuracy' THEN " +
            "       CASE WHEN LOWER(REPLACE(c.title, ' ', '')) = :keyword THEN 1 " +
            "            WHEN LOWER(REPLACE(c.title, ' ', '')) LIKE CONCAT(:keyword, '%') THEN 2 " +
            "            ELSE 3 END " +
            "  END ASC, " +
            "  CASE WHEN :sortType = 'latest' THEN c.releaseDate END DESC, " +
            "  c.id DESC")
    Slice<Content> searchContentsByKeyword(@Param("keyword") String keyword, @Param("sortType") String sortType, Pageable pageable);
    
    // 인기 컨텐츠 조회
    @Query(value =
            "(SELECT c.* FROM contents c " +
                    " JOIN top_contents tc ON c.id = tc.content_id " +
                    " WHERE tc.type = 'MOVIE' " +
                    " ORDER BY tc.rank ASC LIMIT 3) " +
                    "UNION ALL " +
                    "(SELECT c.* FROM contents c " +
                    " JOIN top_contents tc ON c.id = tc.content_id " +
                    " WHERE tc.type = 'TV' " +
                    " ORDER BY tc.rank ASC LIMIT 3)",
            nativeQuery = true)
    List<Content> findTopRankedContentsPerType();
}
