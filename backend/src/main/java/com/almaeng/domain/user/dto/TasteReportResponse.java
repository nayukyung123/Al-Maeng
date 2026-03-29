package com.almaeng.domain.user.dto;

import java.util.List;

public record TasteReportResponse(
        List<GenreStat> topLevelGenres,
        List<GenreStat> subGenres
) {
    public record GenreStat(
            Long genreId,
            String genreName,
            long count,
            double percentage
    ) {}
}
