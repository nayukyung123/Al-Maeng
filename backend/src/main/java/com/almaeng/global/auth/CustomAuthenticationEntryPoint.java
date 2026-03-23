package com.almaeng.global.auth;

import com.almaeng.global.common.ApiResponse;
import com.almaeng.global.error.ErrorCode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;

import java.io.IOException;

@Slf4j
@Component
@RequiredArgsConstructor
public class CustomAuthenticationEntryPoint implements AuthenticationEntryPoint {

    private final ObjectMapper objectMapper;
    @Override
    public void commence(HttpServletRequest request, HttpServletResponse response, AuthenticationException authException) throws IOException, ServletException {
        log.error("인증 실패 (401 UNAUTHORIZED): {}", authException.getMessage());

        // HTTP 상태 코드를 401로 세팅
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);

        // 응답 타입을 JSON으로 세팅
        response.setContentType("application/json;charset=UTF-8");

        // 에러 메시지
        ApiResponse<Void> apiResponse = ApiResponse.fail(ErrorCode.UNAUTHORIZED_ACCESS);

        // JSON 문자열로 변환해서 응답 바디에 쓰기
        response.getWriter().write(objectMapper.writeValueAsString(apiResponse));
    }
}
