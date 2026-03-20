package com.almaeng.domain.search.service;

import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class SearchRankingService {

    private final StringRedisTemplate redisTemplate;

    // Redis Key 생성
    private String getTodayRankingKey() {
        return "search:ranking:" + LocalDate.now().format(DateTimeFormatter.BASIC_ISO_DATE);
    }

    // 검색어 점수 증가 (검색 API 호출될 때마다)
    public void incrementSearchKeyword(String keyword) {

        // 데이터 정제
        if(keyword == null || keyword.trim().isBlank() || keyword.length() > 50) {
            return;
        }

        String key = getTodayRankingKey();
        String cleanKeyword = keyword.trim();

        // 해당 키워드 점수 증가
        redisTemplate.opsForZSet().incrementScore(key, cleanKeyword, 1);

        // 2일 뒤 삭제되도록 관리 (Redis 메모리 관리)
        redisTemplate.expire(key, Duration.ofDays(2));
    }

    // 실시간 검색어 랭킹 조회 (10개)
    public List<String> getTopRankings() {
        String key = getTodayRankingKey();

        Set<String> range = redisTemplate.opsForZSet().reverseRange(key, 0, 9);

        return range != null ? new ArrayList<>(range) : Collections.emptyList();
    }
}
