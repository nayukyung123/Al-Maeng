package com.almaeng.domain.review.service;

import com.almaeng.domain.book.entity.Book;
import com.almaeng.domain.book.repository.BookRepository;
import com.almaeng.domain.completedbook.repository.CompletedBookRepository;
import com.almaeng.domain.review.dto.ReviewCreateRequest;
import com.almaeng.domain.review.entity.Review;
import com.almaeng.domain.review.repository.ReviewRepository;
import com.almaeng.domain.user.entity.User;
import com.almaeng.domain.user.repository.UserRepository;
import com.almaeng.global.error.ApiException;
import com.almaeng.global.error.ErrorCode;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class ReviewService {
    private final ReviewRepository reviewRepository;
    private final UserRepository userRepository;
    private final BookRepository bookRepository;
    private final CompletedBookRepository completedBookRepository;

    @Transactional
    public Long createReview(Long userId, String slug, ReviewCreateRequest request) {
        // slug로 도서 조회
        Book book = bookRepository.findBySlug(slug)
                .orElseThrow(() -> new ApiException(ErrorCode.BOOK_NOT_FOUND));

        // 유저 조회
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ApiException(ErrorCode.USER_NOT_FOUND));


        // 완독 여부 검증
        if(!completedBookRepository.existsByUserIdAndBookId(userId, book.getId())) {
            throw new ApiException(ErrorCode.NOT_COMPLETED_BOOK);
        }

        // 중복 리뷰 검증
        if(reviewRepository.existsByUserIdAndBookId(userId, book.getId())) {
            throw new ApiException(ErrorCode.ALREADY_REVIEWED_BOOK);
        }

        // 데이터 보정 (내용이 없으면 스포일러 = false 강제 처리)
        boolean actualSpoiler = (request.getContent() == null || request.getContent().isBlank())
                ? false : request.getSpoiler();

        // 리뷰 생성 및 저장
        Review review = Review.builder()
                .user(user)
                .book(book)
                .rating(request.getRating())
                .content(request.getContent())
                .spoiler(actualSpoiler)
                .build();

        Review savedReview = reviewRepository.save(review);

        return savedReview.getId();

    }
}
