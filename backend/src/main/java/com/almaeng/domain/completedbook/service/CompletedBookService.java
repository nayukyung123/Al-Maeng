package com.almaeng.domain.completedbook.service;

import com.almaeng.domain.book.entity.Book;
import com.almaeng.domain.book.repository.BookRepository;
import com.almaeng.domain.completedbook.dto.CompletedBookAddRequest;
import com.almaeng.domain.completedbook.dto.CompletedBookResponse;
import com.almaeng.domain.completedbook.entity.CompletedBook;
import com.almaeng.domain.completedbook.repository.CompletedBookRepository;
import com.almaeng.domain.user.entity.User;
import com.almaeng.domain.user.repository.UserRepository;
import com.almaeng.global.error.ApiException;
import com.almaeng.global.error.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CompletedBookService {
    private final CompletedBookRepository completedBookRepository;
    private final UserRepository userRepository;
    private final BookRepository bookRepository;

    // 완독 도서 추가
    @Transactional
    public void addCompletedBook(Long userId, CompletedBookAddRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ApiException(ErrorCode.USER_NOT_FOUND));

        Book book = bookRepository.findById(request.bookId())
                .orElseThrow(() -> new ApiException(ErrorCode.BOOK_NOT_FOUND));

        if(completedBookRepository.existsByUserIdAndBookId(userId,book.getId())) {
            throw new ApiException(ErrorCode.ALREADY_COMPLETED_BOOK);
        }

        CompletedBook newCompletedBook = CompletedBook.builder()
                .user(user)
                .book(book)
                .completedAt(LocalDateTime.now())
                .build();

        completedBookRepository.save(newCompletedBook);
    }

    // 완독 도서 조회
    public List<CompletedBookResponse> getCompletedBooks(Long userId, Sort sort) {
        List<CompletedBook> completedBooks = completedBookRepository.findAllByUserId(userId, sort);

        return completedBooks.stream()
                .map(CompletedBookResponse::from)
                .toList();
    }

    // 완독 도서 삭제
    @Transactional
    public void deleteCompletedBook(Long userId, Long bookId) {
        CompletedBook completedBook = completedBookRepository.findByUserIdAndBookId(userId, bookId)
                .orElseThrow(() -> new ApiException(ErrorCode.COMPLETED_BOOK_NOT_FOUND));

        // 티켓 레포지토리 생성 시 티켓 만들어져 있으면 삭제 못하도록 하는 기능 추가

        completedBookRepository.delete(completedBook);
    }
}
