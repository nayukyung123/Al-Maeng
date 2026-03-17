package com.almaeng.domain.book.repository;

import com.almaeng.domain.book.entity.Book;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Slice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BookRepository extends JpaRepository<Book, Long> {

    // 고도화 때 ElasticSearch 도입 고려 중
    List<Book> findTop5ByTitleContainingOrAuthorContaining(String title, String author);

    Slice<Book> findByTitleContainingOrAuthorContaining(String title, String author, Pageable pageable);
}
