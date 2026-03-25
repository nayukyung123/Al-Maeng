package com.almaeng.domain.recommendation.service;

import com.almaeng.domain.book.dto.BookResponse;
import com.almaeng.domain.book.entity.Book;
import com.almaeng.domain.book.repository.BookRepository;
import com.almaeng.domain.recommendation.dto.TodayCurationResponse;
import com.almaeng.domain.recommendation.entity.UserRecommendationPool;
import com.almaeng.domain.recommendation.repository.UserRecommendationPoolRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class TodayCurationService {

    private final UserRecommendationPoolRepository poolRepository;
    private final BookRepository bookRepository;
    private final RedisTemplate<String, Object> redisTemplate;

    // Redis Key
    private static final String CACHE_KEY_POOL = "curation:pool:";
    private static final String CACHE_KEY_COUNT = "curation:count:";
    private static final String CACHE_KEY_FALLBACK = "curation:isfallback:";

    // 10회차 이후 랜덤 팝업 메시지
    private static final List<String> DYNAMIC_MESSAGES = List.of(
            "아직 마음에 드는 책을 못 찾으셨나요? 취향 탐색을 시작해보세요!",
            "이미 50권의 리스트를 모두 확인하셨네요! 취향 분석으로 인생 책을 찾아볼까요?",
            "다른 유저들은 맞춤형 추천으로 인생 책을 찾았어요. 지금 바로 확인해보세요!"
    );

    @SuppressWarnings("unchecked")
    public TodayCurationResponse getTodayCuration(Long userId) {

        String poolKey = CACHE_KEY_POOL + userId;
        String countKey = CACHE_KEY_COUNT + userId;
        String fallbackKey = CACHE_KEY_FALLBACK + userId;

        // Redis에서 추천 50권 조회
        List<BookResponse> userPool = (List<BookResponse>) redisTemplate.opsForValue().get(poolKey);
        Boolean isFallback = (Boolean) redisTemplate.opsForValue().get(fallbackKey);

        if (isFallback == null) isFallback = false;

        // 캐시 미스 (최초 접속 or 0시 리셋) -> DB 조회 및 스냅샷 저장
        if (userPool == null || userPool.isEmpty()) {
            userPool = fetchAndCachePool(userId, poolKey, fallbackKey);
            isFallback = (Boolean) redisTemplate.opsForValue().get(fallbackKey); // 폴백 여부 다시 확인
        }

        // 현재 새로고침 횟수 업데이트
        Integer currentCount = (Integer) redisTemplate.opsForValue().get(countKey);
        if(currentCount == null) currentCount = 0;

        currentCount += 1;

        // 카운트 저장 (자정 만료)
        redisTemplate.opsForValue().set(countKey, currentCount, getSecondsUntilNextReset());

        // 로직 분기 (1~10회: 정렬 노출 / 11회 이상: 랜덤 노출)
        List<BookResponse> selectedBooks;
        boolean showPopup = false;
        String popupMessage = null;

        if (currentCount <= 10) {
            int startIndex = (currentCount - 1) * 5;
            int endIndex = Math.min(startIndex + 5, userPool.size());
            selectedBooks = userPool.subList(startIndex, endIndex);
        } else {
            Collections.shuffle(userPool);
            selectedBooks = userPool.subList(0, Math.min(5, userPool.size()));
        }

        // 팝업 조건 확인 (랜덤 노출 시 메시지 셔플)
        if (currentCount % 10 == 0) {
            showPopup = true;
            if (currentCount == 10) {
                popupMessage = "취향에 맞는 책을 찾기 어려우신가요?";
            } else {
                popupMessage = DYNAMIC_MESSAGES.get((int) (Math.random() * DYNAMIC_MESSAGES.size()));
            }
        }

        int displayCount = (currentCount - 1) % 10 + 1;

        return TodayCurationResponse.builder()
                .books(selectedBooks)
                .refreshCount(displayCount)
                .isFallback(isFallback)
                .showPopup(showPopup)
                .popupMessage(popupMessage)
                .build();
    }

    // DB 데이터를 Redis에 업데이트
    private List<BookResponse> fetchAndCachePool(Long userId, String poolKey, String fallbackKey) {
        List<BookResponse> dtos;
        boolean isFallback = false;

        // 추천 도서 50권 조회
        List<UserRecommendationPool> dbPool = poolRepository.findTop50ByUserIdOrderByScoreDesc(userId);
        if (!dbPool.isEmpty()) {
            dtos = dbPool.stream()
                    .map(pool -> BookResponse.from(pool.getBook()))
                    .collect(Collectors.toList());
        } else {
            // [콜드 스타트 방어] DB에 추천 데이터가 없으면 인기 도서로 대체
            log.warn("User {} has no recommendation pool. Using fallback (Top 50 books).", userId);
            isFallback = true;
            List<Book> fallbackBooks = bookRepository.findTop50FallbackBooks();
            dtos = fallbackBooks.stream()
                    .map(BookResponse::from)
                    .collect(Collectors.toList());
        }

        // Redis에 자정까지 캐싱 (정상 데이터면 새벽 2시까지 유지, 폴백 데이터면 10분 유지
        Duration ttl = isFallback ? Duration.ofMinutes(10) : getSecondsUntilNextReset();
        redisTemplate.opsForValue().set(poolKey, dtos, ttl);
        redisTemplate.opsForValue().set(fallbackKey, isFallback, ttl);

        return dtos;
    }

    // 리셋(새벽2시)까지 남은 시간 계산
    private Duration getSecondsUntilNextReset() {
        LocalDateTime now = LocalDateTime.now();

        LocalDateTime resetTime = now.toLocalDate().atTime(2, 0);

        if (now.isAfter(resetTime) || now.isEqual(resetTime)) {
            resetTime = resetTime.plusDays(1);
        }
        return Duration.between(now, resetTime);
    }
}
