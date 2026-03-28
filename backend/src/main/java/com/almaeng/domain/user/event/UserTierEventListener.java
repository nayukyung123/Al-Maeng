package com.almaeng.domain.user.event;

import com.almaeng.domain.completedbook.repository.CompletedBookRepository;
import com.almaeng.domain.user.entity.Tier;
import com.almaeng.domain.user.entity.User;
import com.almaeng.domain.user.repository.TierRepository;
import com.almaeng.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class UserTierEventListener {

    private final UserRepository userRepository;
    private final TierRepository tierRepository;
    private final CompletedBookRepository completedBookRepository;

    @EventListener
    public void handleUserTierUpdate(UserTierUpdateEvent event) {
        try {
            Long userId = event.userId();

            // 유저의 현재 정확한 완독 권수 카운트
            int currentCompletedCount = (int) completedBookRepository.countByUserId(userId);

            // 권수에 맞는 새로운 티어 조회
            Tier newTier = tierRepository.findTopByMinExpLessThanEqualOrderByMinExpDesc(currentCompletedCount)
                    .orElseThrow(() -> new IllegalStateException("티어 기준 데이터를 찾을 수 없습니다."));

            // 유저 엔티티 조회 및 업데이트
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));

            user.updateTierAndCount(newTier, currentCompletedCount);

            log.info("🏅 [Tier Updated] User ID: {}, New Tier: {}, Count: {}", userId, newTier.getTierName(), currentCompletedCount);

        } catch (Exception e) {
            log.error("🚨 Failed to update user tier asynchronously", e);
        }
    }
}
