package com.almaeng.domain.completetd_book.entity;

import com.almaeng.domain.book.entity.Book;
import com.almaeng.domain.user.entity.User;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Entity
@Table(name = "user_completed_books")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@EntityListeners(AuditingEntityListener.class)
public class CompletedBook {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "book_id", nullable = false)
    private Book book;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Builder
    public CompletedBook(User user, Book book, LocalDateTime completedAt) {
        this.user = user;
        this.book = book;
        this.completedAt = completedAt;
    }


}
