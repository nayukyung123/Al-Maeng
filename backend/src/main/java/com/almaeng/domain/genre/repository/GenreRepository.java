package com.almaeng.domain.genre.repository;

import com.almaeng.domain.genre.entity.Genre;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface GenreRepository extends JpaRepository<Genre, Long> {
    // 최상위 장르 조회 시, 하위의 자식 장르도 모두 가져오기
    @Query("SELECT g FROM Genre g LEFT JOIN FETCH g.children WHERE g.name = :name")
    Optional<Genre> findByNameWithChildren(@Param("name") String name);

    // 사용자가 취향으로 선택할 수 있는 장르만 조회
    List<Genre> findAllByIsSelectableTrue();
}
