package com.almaeng.domain.book.entity;

import com.almaeng.domain.genre.entity.Genre;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "book_genres")
@IdClass(BookGenreId.class)
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class BookGenre {
    @Id
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "book_id", nullable = false)
    private Book book;

    @Id
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "genre_id", nullable = false)
    private Genre genre;
}