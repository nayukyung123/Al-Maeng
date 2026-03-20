package com.almaeng.global.auth;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Slf4j
@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtTokenProvider jwtTokenProvider;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        // Request Header에서 JWT 토큰 추출
        String token = resolveToken(request);

        // 토큰이 유효한지 검사
        if (token != null && jwtTokenProvider.validateToken(token)) {
            // 3. 토큰에서 userId (subject) 꺼내기
            // (주의: 현재 JwtTokenProvider에 getUserIdFromToken() 같은 메서드가 없다면 아래에 추가해야 합니다!)
            Long userId = jwtTokenProvider.getUserIdFromToken(token);

            // 4. Spring Security Context에 인증 정보 저장
            UsernamePasswordAuthenticationToken authentication =
                    new UsernamePasswordAuthenticationToken(userId, null, null);

            SecurityContextHolder.getContext().setAuthentication(authentication);
            log.debug("Security Context에 '{}' 인증 정보를 저장했습니다, uri: {}", userId, request.getRequestURI());
        }

        filterChain.doFilter(request, response);
    }

    // 헤더에서 "Bearer " 문자열을 떼어내고 순수 토큰만 추출하는 메서드
    private String resolveToken(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (StringUtils.hasText(bearerToken) && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        return null;
    }
}