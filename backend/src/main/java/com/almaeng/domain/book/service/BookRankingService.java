package com.almaeng.domain.book.service;

import com.almaeng.domain.book.dto.BookResponse;
import com.almaeng.domain.book.entity.Book;
import com.almaeng.domain.book.repository.BookRepository;
import com.almaeng.domain.book.type.RankingPeriod;
import com.almaeng.domain.book.type.RankingType;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class BookRankingService {

    private final BookRepository bookRepository;

    public List<BookResponse> getBookRankings(RankingPeriod period, RankingType type) {
        List<Book> books;

        LocalDateTime oneWeekAgo = LocalDateTime.now().minusDays(7);

        books = switch (type) {
            case COMPLETED -> (period == RankingPeriod.WEEKLY)
                    ? bookRepository.findTop5ByCompletedWeekly(oneWeekAgo)
                    : bookRepository.findTop5ByCompletedAllTime();
            case FAVORITE -> (period == RankingPeriod.WEEKLY)
                    ? bookRepository.findTop5ByFavoriteWeekly(oneWeekAgo)
                    : bookRepository.findTop5ByFavoriteAllTime();
            default -> // 기본은 조회순 (VIEW)
                    (period == RankingPeriod.WEEKLY)
                            ? bookRepository.findTop5ByViewWeekly(oneWeekAgo)
                            : bookRepository.findTop5ByViewAllTime();
        };

        return books.stream().map(BookResponse::from).collect(Collectors.toList());
    }
}
