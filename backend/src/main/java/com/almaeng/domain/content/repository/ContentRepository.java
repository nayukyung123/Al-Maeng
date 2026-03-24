package com.almaeng.domain.content.repository;

import com.almaeng.domain.content.entity.Content;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Slice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ContentRepository extends JpaRepository<Content, Long> {

    // 영상 검색 자동완성 (Top 5)
    List<Content> findTop5ByTitleContaining(String title);

    // 영상 검색 결과
    Slice<Content> findByTitleContaining(String title, Pageable pageable);
    
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
