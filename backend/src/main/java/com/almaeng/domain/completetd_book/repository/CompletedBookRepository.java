package com.almaeng.domain.completetd_book.repository;

import com.almaeng.domain.completetd_book.entity.CompletedBook;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CompletedBookRepository extends JpaRepository<CompletedBook, Long> {
    // 완독 도서 정렬 - 기준은 컨트롤러단에서 추가
    List<CompletedBook> findAllByUserId(Long userId, Sort sort);

    // 중복 확인
    boolean existsByUserIdAndBookId(Long userId, Long bookId);

    // 삭제를 위한 완독 도서 찾기
    Optional<CompletedBook> findByUserIdAndBookId(Long userId, Long bookId);
}
