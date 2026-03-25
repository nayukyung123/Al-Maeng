package com.almaeng.domain.ticket.entity;

import com.almaeng.domain.completedbook.entity.CompletedBook;
import com.almaeng.domain.ticket.vo.StyleData;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Entity
@Table(name = "tickets")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@EntityListeners(AuditingEntityListener.class)
public class Ticket {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "completed_book_id", nullable = false)
    private CompletedBook completedBook;

    @Column(name = "comment", length = 255)
    private String comment;

    @Column(name = "ticket_image_url", columnDefinition = "TEXT")
    private String ticketImageUrl;

    @CreatedDate
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "style_data", columnDefinition = "jsonb", nullable = false)
    private StyleData styleData;

    @Builder
    public Ticket(CompletedBook completedBook, String comment, String ticketImageUrl, StyleData styleData) {
        this.completedBook = completedBook;
        this.comment = comment;
        this.ticketImageUrl = ticketImageUrl;
        this.styleData = styleData;
    }
}
