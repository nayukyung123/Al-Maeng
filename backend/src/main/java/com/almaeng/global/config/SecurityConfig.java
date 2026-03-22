package com.almaeng.global.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

import com.almaeng.global.auth.CustomAuthenticationEntryPoint;
import com.almaeng.global.auth.JwtAuthenticationFilter;

import lombok.RequiredArgsConstructor;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final CustomAuthenticationEntryPoint customAuthenticationEntryPoint; // feat 브랜치에서 가져옴

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .csrf(AbstractHttpConfigurer::disable)
                .sessionManagement(session -> session
                        .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
                )
                .authorizeHttpRequests(auth -> auth
                        // 1. 인증 및 API 문서화 관련 (feat 브랜치의 reissue 포함)
                        .requestMatchers(
                                "/actuator/health",
                                "/api/auth/login/**",
                                "/api/auth/signup",
                                "/api/auth/reissue", // 토큰 재발급 API 권한 해제 필수
                                "/swagger-ui/**",
                                "/v3/api-docs/**"
                        ).permitAll()

                        // 2. 누구나 접근 가능한 GET API (dev 브랜치의 상세 매핑 유지)
                        .requestMatchers(HttpMethod.GET,
                                "/api/auth/check-nickname",
                                "/api/books/*/reviews",           // 리뷰 조회 (아래 시니어 코멘트 참고)
                                "/api/banners",                   // 상단 배너 조회
                                "/api/books/suggestions",         // 도서 검색어 자동완성
                                "/api/keywords/rankings",         // 실시간 검색 랭킹
                                "/api/books",                     // 도서 검색 결과
                                "/api/books/rankings",            // 인기 도서 랭킹
                                "/api/recommendations/contents"   // 컨텐츠 크로스 추천
                        ).permitAll()

                        // 3. 그 외의 요청은 인증 필요
                        .anyRequest().authenticated()
                )
                // 4. 예외 처리 설정 (프론트엔드 에러 핸들링을 위해 필수)
                .exceptionHandling(exception -> exception
                        .authenticationEntryPoint(customAuthenticationEntryPoint)
                )
                // 5. 필터 등록
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}