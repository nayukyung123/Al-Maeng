package com.almaeng.domain.review.service;

import com.almaeng.domain.book.entity.Book;
import com.almaeng.domain.book.repository.BookRepository;
import com.almaeng.domain.completedbook.repository.CompletedBookRepository;
import com.almaeng.domain.review.dto.ReviewCreateRequest;
import com.almaeng.domain.review.dto.ReviewResponse;
import com.almaeng.domain.review.dto.ReviewUpdateRequest;
import com.almaeng.domain.review.entity.Review;
import com.almaeng.domain.review.repository.ReviewRepository;
import com.almaeng.domain.review.type.ReviewSortType;
import com.almaeng.domain.user.entity.User;
import com.almaeng.domain.user.repository.UserRepository;
import com.almaeng.global.error.ApiException;
import com.almaeng.global.error.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Slice;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final UserRepository userRepository;
    private final BookRepository bookRepository;
    private final CompletedBookRepository completedBookRepository;

    private static final String CREATED_AT = "createdAt"; // 정렬
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
        boolean actualSpoiler = !(request.getContent() == null || request.getContent().isBlank())
                && Boolean.TRUE.equals(request.getSpoiler());

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

    @Transactional(readOnly = true)
    public Slice<ReviewResponse> getReviewList(String slug, boolean excludeSpoiler,
                                               ReviewSortType sortType, Pageable pageable) {
        // slug 도서 조회
        Book book = bookRepository.findBySlug(slug)
                .orElseThrow(() -> new ApiException(ErrorCode.BOOK_NOT_FOUND));

        // 정렬 조건 매핑
        Sort sort = switch (sortType) {
            case HIGH_RATING -> Sort.by(Sort.Direction.DESC, "rating").and(Sort.by(Sort.Direction.DESC, CREATED_AT));
            case LOW_RATING -> Sort.by(Sort.Direction.ASC, "rating").and(Sort.by(Sort.Direction.DESC, CREATED_AT));
            default -> Sort.by(Sort.Direction.DESC, CREATED_AT);
        };

        Pageable sortedPageable = PageRequest.of(pageable.getPageNumber(), pageable.getPageSize(), sort);

        // 필터 적용 및 조회
        Slice<Review> reviewSlice = excludeSpoiler
                ? reviewRepository.findSliceByBookIdAndSpoilerFalse(book.getId(), sortedPageable)
                : reviewRepository.findSliceByBookId(book.getId(), sortedPageable);

        // DTO 변환 (작성자 티어 정보 포함)
        return reviewSlice.map(r -> new ReviewResponse(
                r.getId(),
                r.getUser().getNickname(),
                r.getUser().getTier().getTierName(),
                r.getUser().getProfileImageUrl(),
                r.getRating(),
                r.getContent(),
                r.getSpoiler(),
                r.getCreatedAt()
        ));
    }

    @Transactional
    public void updateReview(Long userId, Long reviewId, ReviewUpdateRequest request) {
        // 리뷰 존재 확인
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new ApiException(ErrorCode.REVIEW_NOT_FOUND));

        // 작성자 본인 확인
        validateReviewOwner(userId, review);

        // 수정
        review.updateReview(request.getRating(), request.getContent(), request.getSpoiler());
    }

    @Transactional
    public void deleteReview(Long userId, Long reviewId) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new ApiException(ErrorCode.REVIEW_NOT_FOUND));

        validateReviewOwner(userId, review);

        reviewRepository.delete(review);
    }

    // 권한 검증
    private void validateReviewOwner(Long userId, Review review){
        if(!review.getUser().getId().equals(userId)){
            throw new ApiException(ErrorCode.NOT_REVIEW_OWNER);
        }
    }
}
