package com.almaeng.domain.wishlist.service;

import com.almaeng.domain.wishlist.dto.WishlistResponse;
import com.almaeng.domain.wishlist.entity.UserWishlist;
import com.almaeng.domain.wishlist.repository.UserWishlistRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class WishlistService {

    private final UserWishlistRepository wishlistRepository;

    public WishlistResponse.PageData getMyWishlists(Long userId, Pageable pageable) {
        Page<UserWishlist> wishlistPage = wishlistRepository.findWishlistWithBookByUserId(userId, pageable);
        return WishlistResponse.PageData.from(wishlistPage);
    }
}