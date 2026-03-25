package com.almaeng.domain.wishlist.dto;

import com.almaeng.domain.wishlist.entity.UserWishlist;
import lombok.Builder;
import org.springframework.data.domain.Page;

import java.util.List;
import java.util.stream.Collectors;

public class WishlistResponse {

    @Builder
    public record ListItem(
        Long wishlistId,
        Long bookId,
        String slug,
        String title,
        String author,
        String coverImageUrl
    ) {
        public static ListItem from(UserWishlist wishlist) {
            return ListItem.builder()
                    .wishlistId(wishlist.getId())
                    .bookId(wishlist.getBook().getId())
                    .slug(wishlist.getBook().getSlug())
                    .title(wishlist.getBook().getTitle())
                    .author(wishlist.getBook().getAuthor())
                    .coverImageUrl(wishlist.getBook().getCoverImageUrl())
                    .build();
        }
    }

    @Builder
    public record PageData(
        List<ListItem> content,
        int pageNumber,
        int pageSize,
        int totalPages,
        long totalElements,
        boolean isFirst,
        boolean isLast
    ) {
        public static PageData from(Page<UserWishlist> page) {
            List<ListItem> content = page.getContent().stream()
                    .map(ListItem::from)
                    .collect(Collectors.toList());

            return PageData.builder()
                    .content(content)
                    .pageNumber(page.getNumber())
                    .pageSize(page.getSize())
                    .totalPages(page.getTotalPages())
                    .totalElements(page.getTotalElements())
                    .isFirst(page.isFirst())
                    .isLast(page.isLast())
                    .build();
        }
    }
}