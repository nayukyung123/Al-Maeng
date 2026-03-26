package com.almaeng.domain.log.entity;

import com.almaeng.domain.book.entity.Book;
import com.almaeng.domain.log.event.UserActionEvent;
import com.almaeng.domain.user.entity.User;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "click_log")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class ClickLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "book_id", nullable = false)
    private Book book;

    @Column(name = "source", nullable = false, length = 50)
    private String source;

    @Column(name = "action", nullable = false, length = 50)
    private String action;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Builder
    public ClickLog(User user, Book book, String source, String action, LocalDateTime createdAt) {
        this.user = user;
        this.book = book;
        this.source = source;
        this.action = action;
        this.createdAt = createdAt != null ? createdAt : LocalDateTime.now();
    }

    public static ClickLog create(User user, Book book, UserActionEvent event) {
        return ClickLog.builder()
                .user(user)
                .book(book)
                .source(event.source())
                .action(event.action())
                .createdAt(LocalDateTime.now())
                .build();
    }

}
