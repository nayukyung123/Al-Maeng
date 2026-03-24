package com.almaeng.domain.wishlist.controller;

import com.almaeng.domain.wishlist.dto.WishlistAddRequest;
import com.almaeng.domain.wishlist.dto.WishlistResponse;
import com.almaeng.domain.wishlist.service.WishlistService;
import com.almaeng.global.common.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/wishlists")
@RequiredArgsConstructor
public class WishlistController {

    private final WishlistService wishlistService;

    @GetMapping
    public ApiResponse<WishlistResponse.PageData> getMyWishlists(
            @AuthenticationPrincipal Long userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size
    ) {
        PageRequest pageRequest = PageRequest.of(page, size);
        WishlistResponse.PageData result = wishlistService.getMyWishlists(userId, pageRequest);
        return ApiResponse.success(result);
    }

    @PostMapping
    public ApiResponse<Void> addWishlist(
            @AuthenticationPrincipal Long userId,
            @Valid @RequestBody WishlistAddRequest request
    ) {
        wishlistService.addWishlist(userId, request);
        return ApiResponse.success();
    }
}