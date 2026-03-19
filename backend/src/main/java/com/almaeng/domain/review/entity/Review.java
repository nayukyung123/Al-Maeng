package com.almaeng.domain.review.entity;

import com.almaeng.domain.book.entity.Book;
import com.almaeng.domain.user.entity.User;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.DynamicUpdate;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "reviews")
@DynamicUpdate
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Review {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // 🚨 반드시 지연 로딩(LAZY) 적용
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "book_id", nullable = false)
    private Book book;

    @Column(name = "rating")
    private Integer rating;

    @Column(name = "content", columnDefinition = "TEXT")
    private String content;

    @Column(name = "spoiler")
    private Boolean spoiler;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Builder
    public Review(User user, Book book, Integer rating, String content, Boolean spoiler) {
        this.user = user;
        this.book = book;
        this.rating = rating;
        this.content = content;
        this.spoiler = spoiler != null ? spoiler : false;
    }

    // 리뷰 수정 (JPA 더티 체킹용)
    public void updateReview(Integer rating, String content, Boolean spoiler) {
        if (rating != null) this.rating = rating;
        if (content != null) this.content = content;
        if (spoiler != null) this.spoiler = spoiler;
    }
}
