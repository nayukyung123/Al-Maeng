package com.almaeng.domain.review.repository;

import com.almaeng.domain.review.entity.Review;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Slice;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ReviewRepository extends JpaRepository<Review, Long> {

    boolean existsByUserIdAndBookId(Long userId, Long bookId);

    @EntityGraph(attributePaths = {"user", "user.tier"})
    Slice<Review> findSliceByBookId(Long bookId, Pageable pageable);

    @EntityGraph(attributePaths = {"user", "user.tier"})
    Slice<Review> findSliceByBookIdAndSpoilerFalse(Long bookId, Pageable pageable);
}
