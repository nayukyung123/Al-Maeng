package com.almaeng.domain.completedbook.service;

import com.almaeng.domain.book.entity.Book;
import com.almaeng.domain.book.repository.BookRepository;
import com.almaeng.domain.completedbook.dto.CompletedBookAddRequest;
import com.almaeng.domain.completedbook.dto.CompletedBookResponse;
import com.almaeng.domain.completedbook.entity.CompletedBook;
import com.almaeng.domain.completedbook.repository.CompletedBookRepository;
import com.almaeng.domain.log.event.UserActionEvent;
import com.almaeng.domain.ticket.repository.TicketRepository;
import com.almaeng.domain.user.entity.User;
import com.almaeng.domain.user.event.UserTierUpdateEvent;
import com.almaeng.domain.user.repository.UserRepository;
import com.almaeng.global.error.ApiException;
import com.almaeng.global.error.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
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
    private final TicketRepository ticketRepository;
    private final ApplicationEventPublisher eventPublisher;

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
        
        // 로그 이벤트
        eventPublisher.publishEvent(new UserActionEvent(userId, request.bookId(), request.source(), "complete"));
        
        // 티어 동기화 이벤트
        eventPublisher.publishEvent(new UserTierUpdateEvent(userId));
    }

    // 완독 도서 조회
    public List<CompletedBookResponse> getCompletedBooks(Long userId, Sort sort) {
        List<CompletedBook> completedBooks = completedBookRepository.findAllByUserIdWithDetails(userId, sort);

        return completedBooks.stream()
                .map(CompletedBookResponse::from)
                .toList();
    }

    // 완독 도서 삭제
    @Transactional
    public void deleteCompletedBook(Long userId, Long bookId, String source) {
        CompletedBook completedBook = completedBookRepository.findByUserIdAndBookId(userId, bookId)
                .orElseThrow(() -> new ApiException(ErrorCode.COMPLETED_BOOK_NOT_FOUND));

        if(ticketRepository.existsByCompletedBookId(completedBook.getId())) {
            throw new ApiException(ErrorCode.COMPLETED_BOOK_HAS_TICKET);
        }

        completedBookRepository.delete(completedBook);
        
        // 로그 이벤트
        eventPublisher.publishEvent(new UserActionEvent(userId, bookId, source, "complete_cancel"));
    
        // 티어 동기화 이벤트
        eventPublisher.publishEvent(new UserTierUpdateEvent(userId));
    }
}
