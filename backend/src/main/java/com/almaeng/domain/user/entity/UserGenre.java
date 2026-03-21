package com.almaeng.domain.user.entity;

import com.almaeng.domain.genre.entity.Genre;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "users_genres")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class UserGenre {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "genre_id", nullable = false)
    private Genre genre;

    @Builder
    public UserGenre(User user, Genre genre) {
        this.user = user;
        this.genre = genre;
    }
}
