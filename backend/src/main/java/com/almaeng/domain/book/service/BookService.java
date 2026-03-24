// backend/src/main/java/com/almaeng/domain/book/service/BookService.java
package com.almaeng.domain.book.service;

import com.almaeng.domain.book.dto.BookResponse;
import com.almaeng.domain.book.entity.Book;
import com.almaeng.domain.book.repository.BookRepository;
import com.almaeng.global.error.ApiException;
import com.almaeng.global.error.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class BookService {
    private final BookRepository bookRepository;

    // 유사 도서 추천 리스트 조회
    public List<BookResponse> getSimilarBooks(String slug) {
        Book book = bookRepository.findBySlug(slug)
                .orElseThrow(() -> new ApiException(ErrorCode.BOOK_NOT_FOUND));

        return bookRepository.findSimilarBooks(book.getId()).stream()
                .map(BookResponse::from)
                .toList();
    }
}