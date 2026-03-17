package com.almaeng.domain.completetd_book.repository;

import com.almaeng.domain.completetd_book.entity.CompletedBook;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CompletedBookRepository extends JpaRepository<CompletedBook, Long> {
    // 완독 도서 정렬 - 기준은 서비스단에서 추가
    List<CompletedBook> findAllByUserId(Long userId, Sort sort);
}
