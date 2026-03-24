package com.almaeng.domain.book.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "ranking")
@Getter
@Builder
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
public class Ranking {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "book_id", nullable = false)
    private Book book;

    @Column(name = "rank", nullable = false)
    private Integer rank;

    // "WEEKLY_VIEW", "ALL_TIME_COMPLETED" 등의 형태로 저장
    @Column(name = "rank_category", nullable = false, length = 20)
    private String rankCategory;

    @Column(name = "score")
    private Integer score;

    @Column(name = "rank_date")
    private LocalDate rankDate;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
