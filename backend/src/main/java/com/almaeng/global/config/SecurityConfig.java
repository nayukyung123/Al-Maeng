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

import com.almaeng.global.auth.JwtAuthenticationFilter;

import lombok.RequiredArgsConstructor;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .csrf(AbstractHttpConfigurer::disable)
                .sessionManagement(session -> session
                        .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
                )
                .authorizeHttpRequests(auth -> auth
                        // 인증 및 API 문서화 관련
                        .requestMatchers("/actuator/health", "/api/auth/login/**", "/api/auth/signup", "/swagger-ui/**", "/v3/api-docs/**").permitAll()

                        // 누구나 접근 가능한 GET API
                        .requestMatchers(HttpMethod.GET,
                                "/api/auth/check-nickname",
                                "/api/books/*/review",            // 리뷰 조회
                                "/api/banners",                   // 상단 배너 조회
                                "/api/books/suggestions",         // 도서 검색어 자동완성
                                "/api/keywords/rankings",         // 실시간 검색 랭킹
                                "/api/books",                     // 도서 검색 결과
                                "/api/books/rankings",            // 인기 도서 랭킹
                                "/api/recommendations/contents"   // 컨텐츠 크로스 추천
                                ).permitAll()

                        // 그 외의 요청은 인증 필요
                        .anyRequest().authenticated()
                )
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}