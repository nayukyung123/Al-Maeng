package com.almaeng.domain.content.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.DynamicUpdate;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "contents")
@DynamicUpdate
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Content {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "tmdb_id")
    private Long tmdbId;

    @Column(name = "title", nullable = false)
    private String title;

    @Column(name = "type", length = 20)
    private String type;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "poster_url", columnDefinition = "TEXT")
    private String posterUrl;

    @Column(name = "banner_poster_url", columnDefinition = "TEXT")
    private String bannerPosterUrl;

    @Column(name = "vote_count")
    private Long voteCount;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "keywords", columnDefinition = "jsonb")
    private String keywords;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "genres", columnDefinition = "jsonb")
    private String genres;

    @Builder
    public Content(Long tmdbId, String title, String type, String description, String posterUrl, String bannerPosterUrl, Long voteCount, String keywords, String genres) {
        this.tmdbId = tmdbId;
        this.title = title;
        this.type = type;
        this.description = description;
        this.posterUrl = posterUrl;
        this.bannerPosterUrl = bannerPosterUrl;
        this.voteCount = voteCount;
        this.keywords = keywords;
        this.genres = genres;
    }
}