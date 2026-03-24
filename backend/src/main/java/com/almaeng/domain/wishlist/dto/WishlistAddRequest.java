package com.almaeng.domain.wishlist.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class WishlistAddRequest {

    @NotNull(message = "도서 ID는 필수입니다.")
    private Long bookId;
}