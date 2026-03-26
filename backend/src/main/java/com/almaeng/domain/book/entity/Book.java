package com.almaeng.domain.book.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.DynamicUpdate;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "books")
@DynamicUpdate
@Getter
@Builder
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
public class Book {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "title", nullable = false)
    private String title;

    @Column(name = "author", nullable = false)
    private String author;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "page_count")
    private Integer pageCount;

    @Column(name = "isbn", length = 20)
    private String isbn;

    @Column(name = "published_date")
    private LocalDate publishedDate;

    @Column(name = "cover_image_url", columnDefinition = "TEXT")
    private String coverImageUrl;

    @Builder.Default
    @Column(name = "average_rating", columnDefinition = "numeric(2,1)")
    private Double averageRating = 0.0;

    @Column(name = "slug")
    private String slug;

    // 에러 방지를 위한 String (고도화 시 hibernate-vector 적용)
    @Column(name = "embedding_vector", columnDefinition = "vector")
    private String embeddingVector;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Builder.Default
    @OneToMany(mappedBy = "book", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<BookGenre> bookGenres = new ArrayList<>();
}
