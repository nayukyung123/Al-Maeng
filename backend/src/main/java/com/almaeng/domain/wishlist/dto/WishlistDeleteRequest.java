package com.almaeng.domain.wishlist.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class WishlistDeleteRequest {

    @NotBlank(message = "유입 출처(source)는 필수입니다.")
    private String source;
}
