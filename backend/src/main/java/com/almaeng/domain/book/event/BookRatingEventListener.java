package com.almaeng.domain.book.event;

import com.almaeng.domain.book.entity.Book;
import com.almaeng.domain.book.repository.BookRepository;
import com.almaeng.domain.review.event.ReviewChangedEvent;
import com.almaeng.domain.review.repository.ReviewRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Component
@RequiredArgsConstructor
public class BookRatingEventListener {

    private final ReviewRepository reviewRepository;
    private final BookRepository bookRepository;

    @Async
    @EventListener
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void handleReviewChanged(ReviewChangedEvent event) {
        try{
            Long bookId = event.bookId();

            Book book = bookRepository.findById(bookId)
                    .orElseThrow(() -> new IllegalArgumentException("Book not found id: " + bookId));

            Double newAverage = reviewRepository.findAverageRatingByBookId(bookId);

            book.updateAverageRating(newAverage);

            log.info("📊 [Rating Updated] Book ID: {}, New Average: {}", bookId, newAverage);
        } catch (Exception e) {
            log.error("🚨 Failed to update book average rating asynchronously", e);
        }
    }
}
