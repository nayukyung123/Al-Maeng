package com.almaeng.domain.wishlist.dto;

import com.almaeng.domain.wishlist.entity.UserWishlist;
import lombok.Builder;
import lombok.Getter;
import org.springframework.data.domain.Page;

import java.util.List;
import java.util.stream.Collectors;

public class WishlistResponse {

    @Getter
    @Builder
    public static class ListItem {
        private Long wishlistId;
        private Long bookId;
        private String title;
        private String author;
        private String coverImageUrl;

        // 엔티티를 DTO로 변환하는 정적 팩토리 메서드
        public static ListItem from(UserWishlist wishlist) {
            return ListItem.builder()
                    .wishlistId(wishlist.getId())
                    .bookId(wishlist.getBook().getId())
                    .title(wishlist.getBook().getTitle())
                    .author(wishlist.getBook().getAuthor())
                    .coverImageUrl(wishlist.getBook().getCoverImageUrl())
                    .build();
        }
    }

    @Getter
    @Builder
    public static class PageData {
        private List<ListItem> content;
        private int pageNumber;
        private int pageSize;
        private int totalPages;
        private long totalElements;
        private boolean isFirst;
        private boolean isLast;

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