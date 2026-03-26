package com.almaeng.domain.wishlist.service;

import com.almaeng.domain.book.entity.Book;
import com.almaeng.domain.book.repository.BookRepository;
import com.almaeng.domain.log.event.UserActionEvent;
import com.almaeng.domain.user.entity.User;
import com.almaeng.domain.user.repository.UserRepository;
import com.almaeng.domain.wishlist.dto.WishlistAddRequest;
import com.almaeng.domain.wishlist.dto.WishlistResponse;
import com.almaeng.domain.wishlist.entity.UserWishlist;
import com.almaeng.domain.wishlist.repository.UserWishlistRepository;
import com.almaeng.global.error.ApiException;
import com.almaeng.global.error.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class WishlistService {

    private final UserWishlistRepository wishlistRepository;
    private final UserRepository userRepository;
    private final BookRepository bookRepository;
    private final ApplicationEventPublisher eventPublisher;

    public WishlistResponse.PageData getMyWishlists(Long userId, Pageable pageable) {
        Page<UserWishlist> wishlistPage = wishlistRepository.findWishlistWithBookByUserId(userId, pageable);
        return WishlistResponse.PageData.from(wishlistPage);
    }

    @Transactional
    public void addWishlist(Long userId, WishlistAddRequest request) {
        // 1. 중복 검사
        if (wishlistRepository.existsByUserIdAndBookId(userId, request.getBookId())) {
            throw new ApiException(ErrorCode.ALREADY_WISHED_BOOK);
        }
        // 2. 유저 조회
        User user = userRepository.getReferenceById(userId);
        // 3. 도서 조회
        Book book = bookRepository.findById(request.getBookId())
                .orElseThrow(() -> new ApiException(ErrorCode.BOOK_NOT_FOUND));
        // 4. 엔티티 생성 및 저장
        UserWishlist newWishlist = UserWishlist.builder()
                .user(user)
                .book(book)
                .build();

        wishlistRepository.save(newWishlist);
        
        // 5. 이벤트 발행
        eventPublisher.publishEvent(new UserActionEvent(userId, request.getBookId(), request.getSource(), "wish"));
    }

    @Transactional
    public void deleteWishlist(Long userId, Long bookId, String source) {

        // 1. 내 찜 목록에 해당 도서가 있는지 확인
        UserWishlist wishlist = wishlistRepository.findByUserIdAndBookId(userId, bookId)
                .orElseThrow(() -> new ApiException(ErrorCode.WISHLIST_NOT_FOUND));

        // 2. 찜 내역 삭제
        wishlistRepository.delete(wishlist);

        // 3. 이벤트 발행
        eventPublisher.publishEvent(new UserActionEvent(userId, bookId, source, "wish_cancel"));
    }

    // 찜 여부 확인
    public boolean isWished(Long userId, Long bookId) {
        return wishlistRepository.existsByUserIdAndBookId(userId, bookId);
    }
}