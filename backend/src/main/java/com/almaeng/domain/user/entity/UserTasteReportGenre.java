package com.almaeng.domain.user.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Getter
@Setter
@Table(name = "user_taste_report_genres")
public class UserTasteReportGenre {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @Column(name = "genre_id")
    private Long genreId;

    @Column(name = "score")
    private Float score;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}