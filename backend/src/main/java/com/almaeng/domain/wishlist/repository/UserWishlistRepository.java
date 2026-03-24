package com.almaeng.domain.wishlist.repository;

import com.almaeng.domain.wishlist.entity.UserWishlist;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface UserWishlistRepository extends JpaRepository<UserWishlist, Long> {
    @Query(value = "SELECT w FROM UserWishlist w JOIN FETCH w.book b WHERE w.user.id = :userId ORDER BY w.createdAt DESC",
            countQuery = "SELECT count(w) FROM UserWishlist w WHERE w.user.id = :userId")
    Page<UserWishlist> findWishlistWithBookByUserId(@Param("userId") Long userId, Pageable pageable);
}