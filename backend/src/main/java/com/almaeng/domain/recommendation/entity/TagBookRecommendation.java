package com.almaeng.domain.recommendation.entity;

import com.almaeng.domain.book.entity.Book;
import com.almaeng.domain.content.entity.Tag;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Entity
@Table(name = "tag_book_recommendations")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class TagBookRecommendation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "book_id", nullable = false)
    private Book book;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tag_id", nullable = false)
    private Tag tag;

    @Column(name = "score", precision = 5, scale = 4)
    private BigDecimal score;

    @Column(name = "rank")
    private Integer rank;

    @Column(name = "reason_type", length = 50)
    private String reasonType;
}
