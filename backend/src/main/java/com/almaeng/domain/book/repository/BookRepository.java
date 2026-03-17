package com.almaeng.domain.book.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.almaeng.domain.book.entity.Book;

@Repository
public interface BookRepository extends JpaRepository<Book, Long> {

    // 고도화 때 ElasticSearch 도입 고려 중
    List<Book> findTop5ByTitleContainingOrAuthorContaining(String title, String author);
}
