package com.almaeng.domain.book.service;

import com.almaeng.domain.book.dto.BookResponse;
import com.almaeng.domain.book.entity.Book;
import com.almaeng.domain.book.entity.Ranking;
import com.almaeng.domain.book.repository.BookRepository;
import com.almaeng.domain.book.repository.RankingRepository;
import com.almaeng.domain.book.type.RankingPeriod;
import com.almaeng.domain.book.type.RankingType;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

@Slf4j
@Service
@RequiredArgsConstructor
public class BookRankingBatchService {

    private final BookRepository bookRepository;
    private final RankingRepository rankingRepository;
    private final RedisTemplate<String, Object> redisTemplate;

    @EventListener(ApplicationReadyEvent.class) // 서버 켜질 때 1번 실행
    @Scheduled(cron = "0 0/10 * * * *")
    @Transactional
    public void updateAllRankings() {
        log.info("인기 도서 랭킹 캐시 웜업 배치를 시작합니다.");
        LocalDateTime oneWeekAgo = LocalDateTime.now().minusDays(7);

        // 랭킹의 6가지 경우의 수를 모두 계산하여 갱신
        for (RankingPeriod period : RankingPeriod.values()) {
            for (RankingType type : RankingType.values()) {
                updateSpecificRanking(period, type, oneWeekAgo);
            }
        }
        log.info("인기 도서 랭킹 갱신 완료");
    }

    private void updateSpecificRanking(RankingPeriod period, RankingType type, LocalDateTime oneWeekAgo) {
        // Top 5 도서 조회
        List<Book> books = fetchBooksFromDb(period, type, oneWeekAgo);
        
        // 식별자 생성
        String category = period.name() + "_" + type.name();

        // 기존 DB 데이터 삭제
        rankingRepository.deleteAllByRankCategoryBulk(category);

        List<Ranking> rankings = IntStream.range(0, books.size())
                .mapToObj(i -> Ranking.builder()
                        .book(books.get(i))
                        .rank(i+1)
                        .rankCategory(category)
                        .rankDate(LocalDate.now())
                        .build())
                .collect(Collectors.toList());

        // Redis 장애 대비용 Fallback 데이터 저장
        rankingRepository.saveAll(rankings);

        // [캐싱] Redis에 JSON 직렬화하여 저장 - TTL 15분 (배치 주기 10분보다 길게 설정)
        List<BookResponse> responseList = books.stream().map(BookResponse::from).collect(Collectors.toList());
        String redisKey = "book:ranking:" + category;
        redisTemplate.opsForValue().set(redisKey, responseList, Duration.ofMinutes(15));
    }

    private List<Book> fetchBooksFromDb(RankingPeriod period, RankingType type, LocalDateTime oneWeekAgo) {
        return switch(type) {
            case COMPLETED -> (period == RankingPeriod.WEEKLY)
                    ? bookRepository.findTop5ByCompletedWeekly(oneWeekAgo)
                    : bookRepository.findTop5ByCompletedAllTime();
            case FAVORITE -> (period == RankingPeriod.WEEKLY)
                    ? bookRepository.findTop5ByFavoriteWeekly(oneWeekAgo)
                    : bookRepository.findTop5ByFavoriteAllTime();
            default -> (period == RankingPeriod.WEEKLY)
                    ? bookRepository.findTop5ByViewWeekly(oneWeekAgo)
                    : bookRepository.findTop5ByViewAllTime();
        };
    }


}
