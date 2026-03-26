package com.almaeng.domain.user.service;

import com.almaeng.domain.completedbook.repository.CompletedBookRepository;
import com.almaeng.domain.user.dto.TasteReportResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class UserTasteReportService {
    private static final String NOVEL_TOP_LEVEL_GENRE_NAME = "소설";

    private final CompletedBookRepository completedBookRepository;

    public TasteReportResponse getTasteReport(Long userId) {
        List<CompletedBookRepository.GenreCountProjection> topLevelRows =
                completedBookRepository.aggregateTopLevelGenres(userId);

        if (topLevelRows.isEmpty()) {
            return new TasteReportResponse(Collections.emptyList(), Collections.emptyList());
        }

        List<CompletedBookRepository.GenreCountProjection> subGenreRows =
                completedBookRepository.aggregateSubGenresByTopLevelGenre(userId, NOVEL_TOP_LEVEL_GENRE_NAME);

        return new TasteReportResponse(
                toGenreStats(topLevelRows),
                toGenreStats(subGenreRows)
        );
    }

    private List<TasteReportResponse.GenreStat> toGenreStats(List<CompletedBookRepository.GenreCountProjection> rows) {
        long totalCount = rows.stream()
                .mapToLong(CompletedBookRepository.GenreCountProjection::getBookCount)
                .sum();

        if (totalCount == 0) {
            return Collections.emptyList();
        }

        return rows.stream()
                .map(row -> new TasteReportResponse.GenreStat(
                        row.getGenreId(),
                        row.getGenreName(),
                        row.getBookCount(),
                        (row.getBookCount() * 100.0) / totalCount
                ))
                .toList();
    }
}
