package com.almaeng.domain.genre.dto;

import com.almaeng.domain.genre.entity.Genre;

public record GenreResponse(
        Long id,
        String genreName
) {
    public static GenreResponse from(Genre genre) {
        return new GenreResponse(
                genre.getId(),
                genre.getName()
        );
    }


}
