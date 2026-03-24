package com.almaeng.domain.book.service;

import com.almaeng.domain.book.dto.BookResponse;
import com.almaeng.domain.book.entity.Ranking;
import com.almaeng.domain.book.repository.RankingRepository;
import com.almaeng.domain.book.type.RankingPeriod;
import com.almaeng.domain.book.type.RankingType;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class BookRankingService {

    private final RedisTemplate<String, Object> redisTemplate;
    private final RankingRepository rankingRepository;

    public List<BookResponse> getBookRankings(RankingPeriod period, RankingType type) {

        String category = period.name() + "_" + type.name();
        String redisKey = "book:ranking:" + category;

        try {
            // Redis에서 조회 시도
            Object cachedData = redisTemplate.opsForValue().get(redisKey);
            if(cachedData != null) {
                return (List<BookResponse>) cachedData;
            }
        } catch (Exception e) {
            log.error("Redis에서 랭킹을 가져오는데 실패했습니다. DB 조회로 폴백합니다. Key: {}", redisKey, e);
        }

        // Cache Miss 또는 Redis 장애 시, DB 조회
        log.warn("Cache Miss 발생. DB에서 랭킹 데이터를 조회합니다. Category: {}", category);
        List<Ranking> dbRankings = rankingRepository.findByRankCategoryOrderByRankAsc(category);

        return dbRankings.stream()
                .map(ranking -> BookResponse.from(ranking.getBook()))
                .collect(Collectors.toList());
    }
}

