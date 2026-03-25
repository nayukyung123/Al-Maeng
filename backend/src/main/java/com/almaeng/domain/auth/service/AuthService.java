package com.almaeng.domain.auth.service;

import com.almaeng.domain.auth.dto.LoginResponse;
import com.almaeng.domain.auth.dto.SignupRequest;
import com.almaeng.domain.auth.dto.SignupResponse;
import com.almaeng.domain.auth.dto.TokenResponse;
import com.almaeng.domain.user.entity.SocialAccount;
import com.almaeng.domain.user.entity.Tier;
import com.almaeng.domain.user.entity.User;
import com.almaeng.domain.user.entity.UserTasteReportGenre;
import com.almaeng.domain.user.repository.TierRepository;
import com.almaeng.domain.user.repository.UserRepository;
import com.almaeng.domain.user.repository.UserTasteReportGenreRepository;
import com.almaeng.global.auth.JwtTokenProvider;
import com.almaeng.global.error.ApiException;
import com.almaeng.global.error.ErrorCode;
import com.almaeng.global.infra.oauth.OAuthClient;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AuthService {
    private static final List<String> RESERVED_WORDS = List.of("admin", "manage", "manager", "almaeng", "root");
    private static final String TEMP_NICKNAME_PREFIX = "user_";
    private final List<OAuthClient> oAuthClients;
    private final JwtTokenProvider jwtTokenProvider;
    private final UserRepository userRepository;
    private final StringRedisTemplate redisTemplate;
    private final TierRepository tierRepository;

    private final UserTasteReportGenreRepository tasteRepository;

    @Value("${jwt.refresh-expiration}")
    private long refreshExpiration;

    // kakao, google, naver 식별, ID 추출
    @Transactional
    public LoginResponse login(String provider, String accessToken) {
        OAuthClient oAuthClient = oAuthClients.stream()
                .filter(client -> client.getProvider().equalsIgnoreCase(provider))
                .findFirst()
                .orElseThrow(() -> new ApiException(ErrorCode.INVALID_PROVIDER_OR_TOKEN));

        String providerId = oAuthClient.getProviderId(accessToken);
        // DB 조회를 통해 기존 유저면 '로그인 처리', 없으면 '신규 가입'으로 분기
        return userRepository.findByProviderId(providerId)
                .map(this::handleExistingUser)
                .orElseGet(() -> handleNewUser(provider, providerId));
    }

    // 로그인 처리
    // Registered: TRUE
    private LoginResponse handleExistingUser(User user) {
        return createLoginResponse(user, true);
    }

    // 회원가입, 초기 세팅
    // Registered : FALSE
    private LoginResponse handleNewUser(String provider, String providerId) {

        // 기본 티어 조회
        Tier defaultTier = tierRepository.findById(1)
                .orElseThrow(() -> new ApiException(ErrorCode.TIER_NOT_FOUND));

        // 유저 가입
        User newUser = User.builder()
                .tier(defaultTier)
                .nickname("USER_" + providerId.substring(0, 5))
                .build();

        // 소셜 계정 객체 생성 및 연결
        SocialAccount socialAccount = SocialAccount.builder()
                .user(newUser)
                .provider(provider.toUpperCase())
                .providerId(providerId)
                .build();

        newUser.getSocialAccounts().add(socialAccount);

        // SocialAccount 연결 로직이 있다면 여기서 추가
        userRepository.save(newUser);

        return createLoginResponse(newUser, false);
    }

    // JWT 발급, Redis 저장
    private LoginResponse createLoginResponse(User user, boolean isRegistered) {
        String accessToken = jwtTokenProvider.createAccessToken(user.getId());
        String refreshToken = jwtTokenProvider.createRefreshToken(user.getId());

        // Redis에 Refresh Token 저장 및 만료시간(TTL) 설정
        redisTemplate.opsForValue().set(
                "RT:" + user.getId(),
                refreshToken,
                Duration.ofMillis(jwtTokenProvider.getRefreshExpiration()));

        return new LoginResponse(accessToken, refreshToken, isRegistered);
    }

    private void assertNicknamePolicy(String nickname) {
        String lowerNickname = nickname.toLowerCase();
        if (RESERVED_WORDS.contains(lowerNickname)) {
            throw new ApiException(ErrorCode.INVALID_INPUT_VALUE);
        }
        if (lowerNickname.startsWith(TEMP_NICKNAME_PREFIX)) {
            throw new ApiException(ErrorCode.INVALID_INPUT_VALUE);
        }
    }

    // 닉네임이 시스템 정책(금칙어, 임시 패턴)에 위배되지 않는지 검사
    public boolean checkNicknameAvailability(String nickname) {
        assertNicknamePolicy(nickname);
        boolean exists = userRepository.existsByNickname(nickname);
        return !exists;
    }

    // 닉네임 변경 검증 - null이면 닉네임 필드 미변경으로 간주, 현재와 동일하면 스킵.
    public void validateNicknameForProfileUpdate(Long userId, String newNickname, String currentNickname) {
        if (newNickname == null) {
            return;
        }
        if (newNickname.equals(currentNickname)) {
            return;
        }
        assertNicknamePolicy(newNickname);
        if (userRepository.existsByNicknameAndIdNot(newNickname, userId)) {
            throw new ApiException(ErrorCode.INVALID_INPUT_VALUE);
        }
    }

    // 회원가입 시 정보입력
    @Transactional
    public SignupResponse signup(Long userId, SignupRequest request) {
        // 임시 유저 조회
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ApiException(ErrorCode.USER_NOT_FOUND));
        // 닉네임 유효성 및 중복 최종 검증
        if (!checkNicknameAvailability(request.nickname())) {
            throw new ApiException(ErrorCode.INVALID_INPUT_VALUE);
        }
        // 온보딩 정보 업데이트
        user.completeOnboarding(
                request.nickname(),
                request.profileImageUrl(),
                request.birthYear(),
                request.gender()
        );

        // 취향 정보
        if (request.genreIds() != null && !request.genreIds().isEmpty()) {
            for (Long genreId : request.genreIds()) {
                UserTasteReportGenre taste = new UserTasteReportGenre();
                taste.setUser(user);
                taste.setGenreId(genreId);
                tasteRepository.save(taste);
            }
        }

        //온보딩 완료 후 정식 토큰 발급
        String newAccessToken = jwtTokenProvider.createAccessToken(user.getId());
        String newRefreshToken = jwtTokenProvider.createRefreshToken(user.getId());

        // Redis의 Refresh Token 갱신
        redisTemplate.opsForValue().set(
                "RT:" + user.getId(),
                newRefreshToken,
                Duration.ofMillis(jwtTokenProvider.getRefreshExpiration())
        );

        return SignupResponse.success(newAccessToken, newRefreshToken);
    }

    // 토큰 재발급
    @Transactional
    public TokenResponse reissue(String refreshToken) {
        // 1. Refresh Token 자체의 유효성/만료 여부 검증
        if (!jwtTokenProvider.validateToken(refreshToken)) {
            throw new ApiException(ErrorCode.UNAUTHORIZED_ACCESS);
        }

        // 2. 토큰에서 유저 ID 추출
        Long userId = jwtTokenProvider.getUserIdFromToken(refreshToken);

        // 3. Redis에 저장된 Refresh Token과 일치하는지 대조
        String storedRefreshToken = redisTemplate.opsForValue().get("RT:" + userId);
        if (!refreshToken.equals(storedRefreshToken)) {
            throw new ApiException(ErrorCode.UNAUTHORIZED_ACCESS);
        }

        // 4. 검증 통과
        String newAccessToken = jwtTokenProvider.createAccessToken(userId);
        String newRefreshToken = jwtTokenProvider.createRefreshToken(userId);

        // 5. Redis의 기존 Refresh Token 갱신
        redisTemplate.opsForValue().set(
                "RT:" + userId,
                newRefreshToken,
                Duration.ofMillis(jwtTokenProvider.getRefreshExpiration())
        );
        return new TokenResponse(newAccessToken, newRefreshToken);
    }

     // 리프레시토큰 삭제 + 현재 액세스 토큰 블랙리스트 (로그아웃, 회원 탈퇴 공통 적용)
    @Transactional
    public void invalidateSession(String accessToken, Long userId) {
        if (Boolean.TRUE.equals(redisTemplate.hasKey("RT:" + userId))) {
            redisTemplate.delete("RT:" + userId);
        }

        Long expiration = jwtTokenProvider.getExpiration(accessToken);
        redisTemplate.opsForValue().set(
                "BL:" + accessToken,
                "logout",
                Duration.ofMillis(expiration)
        );
    }

    // 로그아웃
    @Transactional
    public void logout(String accessToken, Long userId) {
        invalidateSession(accessToken, userId);
    }
}
