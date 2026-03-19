package com.almaeng.domain.auth.service;

import com.almaeng.domain.auth.dto.LoginResponse;
import com.almaeng.domain.user.entity.SocialAccount;
import com.almaeng.domain.user.entity.User;
import com.almaeng.domain.user.repository.UserRepository;
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
public class AuthService {
    private final List<OAuthClient> oAuthClients;
    private final JwtTokenProvider jwtTokenProvider;
    private final UserRepository userRepository;
    private final StringRedisTemplate redisTemplate;

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
                .map(user -> handleExistingUser(user))
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
        // 유저 가입
        User newUser = User.builder()
                .tierId(1)
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
                Duration.ofMillis(refreshExpiration)
        );

        return new LoginResponse(accessToken, refreshToken, isRegistered);
    }
}
