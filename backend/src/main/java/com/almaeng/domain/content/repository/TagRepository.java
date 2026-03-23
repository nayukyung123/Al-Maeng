package com.almaeng.domain.content.repository;

import com.almaeng.domain.content.entity.Tag;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TagRepository extends JpaRepository<Tag, Long> {
    
    // 특정 영상에 달린 Tag List 조회
    List<Tag> findByContentId(Long contentId);
}
