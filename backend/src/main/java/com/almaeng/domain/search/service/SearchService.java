package com.almaeng.domain.search.service;

import com.almaeng.domain.book.dto.BookResponse;
import com.almaeng.domain.book.dto.BookSuggestionResponse;
import com.almaeng.domain.book.entity.Book;
import com.almaeng.domain.book.repository.BookRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Slice;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class SearchService {

    private final BookRepository bookRepository;

    // 도서 검색 자동완성
    public List<BookSuggestionResponse> getSuggestions(String keyword) {
        if(keyword == null || keyword.trim().isEmpty()) {
            return List.of();
        }

        List<Book> books = bookRepository.findTop5ByTitleContainingOrAuthorContaining(keyword, keyword);

        return books.stream()
                .map(BookSuggestionResponse::from)
                .toList();
    }

    // 도서 검색 결과
    public Slice<BookResponse> searchBooks(String keyword, Pageable pageable){
        String trimmedKeyword = (keyword != null) ? keyword.trim() : "";

        if(trimmedKeyword.isEmpty()) {
            return Page.empty();
        }

        return bookRepository.findByTitleContainingOrAuthorContaining(trimmedKeyword, trimmedKeyword, pageable)
                .map(BookResponse::from);
    }

}
