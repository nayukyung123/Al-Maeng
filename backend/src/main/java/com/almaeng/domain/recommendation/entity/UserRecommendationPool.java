package com.almaeng.domain.recommendation.entity;

import com.almaeng.domain.book.entity.Book;
import com.almaeng.domain.user.entity.User;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "user_recommendation_pool")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class UserRecommendationPool {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "book_id", nullable = false)
    private Book book;

    private Double score;

    @Column(name = "reason_type", length = 50)
    private String reasonType;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

}
