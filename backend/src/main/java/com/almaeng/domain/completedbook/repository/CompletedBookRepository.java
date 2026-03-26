package com.almaeng.domain.completedbook.repository;

import com.almaeng.domain.completedbook.entity.CompletedBook;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface CompletedBookRepository extends JpaRepository<CompletedBook, Long> {
    // 완독 도서 정렬 - 기준은 컨트롤러단에서 추가
    List<CompletedBook> findAllByUserId(Long userId, Sort sort);

    // 중복 확인
    boolean existsByUserIdAndBookId(Long userId, Long bookId);

    // 삭제를 위한 완독 도서 찾기
    Optional<CompletedBook> findByUserIdAndBookId(Long userId, Long bookId);

    // 완독도서의 최상위 장르 찾기
    @Query("SELECT DISTINCT cb FROM CompletedBook cb " +
            "JOIN FETCH cb.book b " +
            "LEFT JOIN FETCH b.bookGenres bg " +
            "LEFT JOIN FETCH bg.genre g " +
            "LEFT JOIN FETCH g.parent " +
            "WHERE cb.user.id = :userId")
    List<CompletedBook> findAllByUserIdWithDetails(@Param("userId") Long userId, Sort sort);

    @Query("SELECT COUNT(cb) FROM CompletedBook cb WHERE cb.user.id = :userId")
    long countByUserId(@Param("userId") Long userId);
}
