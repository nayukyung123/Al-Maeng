package com.almaeng.domain.user.service;

import com.almaeng.domain.auth.service.AuthService;
import com.almaeng.domain.completedbook.repository.CompletedBookRepository;
import com.almaeng.domain.genre.entity.Genre;
import com.almaeng.domain.genre.repository.GenreRepository;
import com.almaeng.domain.user.dto.TierInfo;
import com.almaeng.domain.user.dto.UserProfileResponse;
import com.almaeng.domain.user.dto.UserProfileUpdateRequest;
import com.almaeng.domain.user.entity.Tier;
import com.almaeng.domain.user.entity.User;
import com.almaeng.domain.user.entity.UserGenre;
import com.almaeng.domain.user.repository.TierRepository;
import com.almaeng.domain.user.repository.UserGenreRepository;
import com.almaeng.domain.user.repository.UserRepository;
import com.almaeng.global.error.ApiException;
import com.almaeng.global.error.ErrorCode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserService {
    private final UserRepository userRepository;
    private final UserGenreRepository userGenreRepository;
    private final GenreRepository genreRepository;
    private final AuthService authService;
    private final TierRepository tierRepository;
    private final CompletedBookRepository completedBookRepository;

    // 프로필 조회
    @Transactional(readOnly = true)
    public UserProfileResponse getUserProfile(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ApiException(ErrorCode.USER_NOT_FOUND));

        List<Long> tasteData = userGenreRepository.findAllByUserId(userId).stream()
                .map(userGenre -> userGenre.getGenre().getId())
                .toList();

        int completedCount = (int) completedBookRepository.countByUserId(userId);
        int exp = completedCount; // 경험치 = 완독 권수 (요구사항에 맞게 조정 가능)

        Tier currentTier = tierRepository.findTopByMinExpLessThanEqualOrderByMinExpDesc(exp)
                .orElse(user.getTier());
        Integer nextMinExp = tierRepository.findFirstByMinExpGreaterThanOrderByMinExpAsc(exp)
                .map(Tier::getMinExp)
                .orElse(null);

        TierInfo tierInfo = new TierInfo(
                currentTier != null ? currentTier.getId() : null,
                currentTier != null ? currentTier.getTierName() : null,
                currentTier != null ? currentTier.getMinExp() : 0,
                nextMinExp,
                exp
        );

        return new UserProfileResponse(
                user.getNickname(),
                user.getProfileImageUrl(),
                user.getBirthYear(),
                user.getGender(),
                tasteData,
                completedCount,
                tierInfo
        );
    }

    // 프로필 수정
    @Transactional
    public void updateUserProfile(Long userId, UserProfileUpdateRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ApiException(ErrorCode.USER_NOT_FOUND));

        authService.validateNicknameForProfileUpdate(userId, request.nickname(), user.getNickname());

        // 1. 기본 프로필 정보 업데이트
        user.updateProfile(
                request.nickname(),
                request.birthYear(),
                request.gender(),
                request.profileImageUrl()
        );

        // 2. 취향 데이터 업데이트: 전체 삭제 후 데이터 삽입
        if (request.tasteData() != null) {
            userGenreRepository.deleteAllByUserId(userId);

            // 중복 제거 후 유효한 ID 개수 비교
            Set<Long> uniqueTasteIds = request.tasteData().stream()
                    .filter(id -> id != null)
                    .collect(Collectors.toSet());

            if (!uniqueTasteIds.isEmpty()) {
                List<Long> uniqueTasteIdList = uniqueTasteIds.stream().toList();
                List<Genre> genres = genreRepository.findAllById(uniqueTasteIdList);

                if (genres.size() != uniqueTasteIdList.size()) {
                    throw new ApiException(ErrorCode.INVALID_GENRE_ID);
                }

                List<UserGenre> newUserGenres = genres.stream()
                        .map(genre -> UserGenre.builder()
                                .user(user)
                                .genre(genre)
                                .build())
                        .toList();

                userGenreRepository.saveAll(newUserGenres);
            }
        }
    }

    //회원 탈퇴
    @Transactional
    public void deleteUser(Long userId, String accessToken) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ApiException(ErrorCode.USER_NOT_FOUND));

        // 토큰 만료/파싱 이슈 등으로 세션 무효화가 실패해도, 사용자 삭제 자체는 진행
        try {
            authService.invalidateSession(accessToken, userId);
        } catch (Exception e) {
            log.warn("invalidateSession failed while deleting user. userId={}, accessTokenPresent={}", userId, accessToken != null, e);
        }
        userRepository.delete(user);
    }
}
