package com.almaeng.domain.user.entity;

import com.almaeng.domain.genre.entity.Genre;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "users_genres")
@IdClass(UserGenreId.class)
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class UserGenre {

    @Id
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @Id
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "genre_id")
    private Genre genre;
}