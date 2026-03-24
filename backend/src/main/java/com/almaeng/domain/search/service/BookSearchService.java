package com.almaeng.domain.search.service;

import com.almaeng.domain.book.dto.BookResponse;
import com.almaeng.domain.book.dto.BookSuggestionResponse;
import com.almaeng.domain.book.entity.Book;
import com.almaeng.domain.book.repository.BookRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Slice;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class BookSearchService {

    private final BookRepository bookRepository;

    // 도서 검색 자동완성
    public List<BookSuggestionResponse> getSuggestions(String keyword) {

        if (keyword == null || keyword.trim().isEmpty()) {
            return List.of();
        }

        // 띄어쓰기 무시 및 대소문자 무시를 위한 전처리
        String processedKeyword = keyword.replaceAll("\\s+", "").toLowerCase();

        List<Book> books = bookRepository.findSuggestionsByKeyword(processedKeyword, PageRequest.of(0, 5));

        return books.stream()
                .map(BookSuggestionResponse::from)
                .toList();
    }



    // 도서 검색 결과
    public Slice<BookResponse> searchBooks(String keyword, String sort, Pageable pageable){
        if (keyword == null || keyword.trim().isEmpty()) {
            return Page.empty();
        }

        String processedKeyword = keyword.replaceAll("\\s+", "").toLowerCase();

        return bookRepository.searchBooksByKeyword(processedKeyword, sort, pageable)
                .map(BookResponse::from);
    }



}
