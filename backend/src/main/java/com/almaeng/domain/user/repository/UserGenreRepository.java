package com.almaeng.domain.user.repository;

import com.almaeng.domain.user.entity.UserGenre;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface UserGenreRepository extends JpaRepository<UserGenre, Long> {

    // 기존 매핑 데이터 일괄 삭제
    void deleteAllByUserId(Long userId);

    // 프로필 조회 시 취향 데이터 로드
    List<UserGenre> findAllByUserId(Long userId);
}
