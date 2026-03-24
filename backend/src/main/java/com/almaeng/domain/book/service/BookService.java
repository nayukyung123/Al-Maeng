package com.almaeng.domain.book.service;

import com.almaeng.domain.book.dto.BookDetailResponse;
import com.almaeng.domain.book.entity.Book;
import com.almaeng.domain.book.repository.BookRepository;
import com.almaeng.global.error.ApiException;
import com.almaeng.global.error.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class BookService {
    private final BookRepository bookRepository;

    public BookDetailResponse getBookDetail(String slug) {
        Book book = bookRepository.findBySlug(slug)
                .orElseThrow(() -> new ApiException(ErrorCode.BOOK_NOT_FOUND)); // 실무에선 Custom Exception 사용
        return BookDetailResponse.from(book);
    }
}