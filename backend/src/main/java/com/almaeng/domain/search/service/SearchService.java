package com.almaeng.domain.search.service;

import com.almaeng.domain.book.dto.BookSuggestionResponse;
import com.almaeng.domain.book.entity.Book;
import com.almaeng.domain.book.repository.BookRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class SearchService {

    private final BookRepository bookRepository;

    public List<BookSuggestionResponse> getSuggestions(String keyword) {
        if(keyword == null || keyword.trim().isEmpty()) {
            return List.of();
        }

        List<Book> books = bookRepository.findTop5ByTitleContainingOrAuthorContaining(keyword, keyword);

        return books.stream()
                .map(BookSuggestionResponse::from)
                .collect(Collectors.toList());
    }
}
