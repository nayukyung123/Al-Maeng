package com.almaeng.domain.review.repository;

import com.almaeng.domain.review.entity.Review;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ReviewRepository extends JpaRepository<Review, Long> {

    boolean existsByUserIdAndBookId(Long userId, Long bookId);
}
