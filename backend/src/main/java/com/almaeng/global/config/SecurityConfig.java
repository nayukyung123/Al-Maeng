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
import org.springframework.web.cors.CorsConfigurationSource;

import com.almaeng.global.auth.CustomAuthenticationEntryPoint;
import com.almaeng.global.auth.JwtAuthenticationFilter;

import lombok.RequiredArgsConstructor;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

        private final JwtAuthenticationFilter jwtAuthenticationFilter;
        private final CustomAuthenticationEntryPoint customAuthenticationEntryPoint;
        private final CorsConfigurationSource corsConfigurationSource;

        @Bean
        public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
                http
                                .cors(cors -> cors.configurationSource(corsConfigurationSource))
                                .csrf(AbstractHttpConfigurer::disable)
                                .sessionManagement(session -> session
                                                .sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                                .authorizeHttpRequests(auth -> auth
                                                // 1. 인증 및 API 문서화 관련
                                                .requestMatchers(
                                                                "/actuator/health",
                                                                "/api/auth/login/**",
                                                                "/api/auth/signup",
                                                                "/api/auth/reissue",
                                                                "/swagger-ui/**",
                                                                "/v3/api-docs/**",
                                                                "/api/auth/callback/**")
                                                .permitAll()

                                                // 2. 누구나 접근 가능한 GET API
                                                .requestMatchers(HttpMethod.GET,
                                                                "/api/auth/check-nickname",
                                                                "/api/genres", // 사용자 취향 조사용 장르 조회
                                                                "/api/books/*/reviews", // 리뷰 조회
                                                                "/api/banners", // 상단 배너 조회
                                                                "/api/books/suggestions", // 도서 검색어 자동완성
                                                                "/api/contents/suggestions", // 컨텐츠 검색어 자동완성
                                                                "/api/keywords/rankings", // 실시간 검색 랭킹
                                                                "/api/books", // 도서 검색 결과
                                                                "/api/books/*", // 도서 상세 조회 ({slug} 대응)
                                                                "/api/books/*/recommendations", // 유사 도서 추천 조회
                                                                "/api/books/rankings", // 인기 도서 랭킹
                                                                "/api/recommendations/contents" // 컨텐츠 크로스 추천
                                                ).permitAll()

                                                // 3. 그 외의 요청은 인증 필요
                                                .anyRequest().authenticated())
                                // 4. 예외 처리 설정
                                .exceptionHandling(exception -> exception
                                                .authenticationEntryPoint(customAuthenticationEntryPoint))
                                // 5. 필터 등록
                                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

                return http.build();
        }

}