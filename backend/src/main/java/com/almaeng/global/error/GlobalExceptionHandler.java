package com.almaeng.global.error;

import com.almaeng.global.common.ApiResponse;
import com.almaeng.global.error.mattermost.NotificationManager;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.core.env.Environment;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import com.fasterxml.jackson.databind.exc.InvalidFormatException;

import java.util.Arrays;
import java.util.Enumeration;
import java.util.List;

@Slf4j
@RestControllerAdvice
@RequiredArgsConstructor
public class GlobalExceptionHandler {

    private final NotificationManager notificationManager;
    private final Environment env;

    // 1. 비즈니스 로직 예외 처리
    @ExceptionHandler(ApiException.class)
    public ResponseEntity<ApiResponse<Void>> handleApiException(ApiException e) {
        log.warn("Business Exception : {}", e.getErrorCode().getMessage());

        return ResponseEntity
                .status(e.getErrorCode().getStatus())
                .body(ApiResponse.fail(e.getErrorCode()));
    }

    // 2. 입력값 검증 예외 처리 (@Valid 어노테이션 실패 시)
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Void>> handleValidationException(MethodArgumentNotValidException e) {
        List<String> errorMessages = e.getBindingResult().getFieldErrors().stream()
                .map(error -> String.format("[%s] %s", error.getField(), error.getDefaultMessage()))
                .toList();

        String combinedMessage = String.join(", ", errorMessages);
        log.warn("Validation Exception : {}", combinedMessage);

        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.fail(ErrorCode.INVALID_INPUT_VALUE, combinedMessage));
    }

    // 2-1. JSON 역직렬화 실패 (enum 값 형식 오류 등)
    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ApiResponse<Void>> handleHttpMessageNotReadableException(HttpMessageNotReadableException e) {
        Throwable cause = e.getCause();

        if (cause instanceof InvalidFormatException invalidFormatException) {
            boolean hasGenderField = invalidFormatException.getPath().stream()
                    .anyMatch(ref -> "gender".equals(ref.getFieldName()));

            if (hasGenderField) {
                String msg = invalidFormatException.getMessage();
                if (msg != null && msg.contains("성별")) {
                    return ResponseEntity
                            .status(HttpStatus.BAD_REQUEST)
                            .body(ApiResponse.fail(ErrorCode.INVALID_INPUT_VALUE, "성별 값 형식이 잘못되었습니다"));
                }

                return ResponseEntity
                        .status(HttpStatus.BAD_REQUEST)
                        .body(ApiResponse.fail(ErrorCode.INVALID_INPUT_VALUE, "성별 값 형식이 잘못되었습니다"));
            }
        }

        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.fail(ErrorCode.INVALID_INPUT_VALUE));
    }

    // 3. 서버 런타임 에러 처리
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Void>> handleException(Exception e, HttpServletRequest req) {
        log.error("Unhandled Exception : ", e);

        // 현재 실행 환경이 'local'이 아닐 때만 Mattermost 알림 비동기 발송
        if (!Arrays.asList(env.getActiveProfiles()).contains("local")) {
            notificationManager.sendNotification(e, req.getRequestURI(), getParams(req));
        }

        return ResponseEntity
                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.fail(ErrorCode.INTERNAL_SERVER_ERROR));
    }

    // 4. Request 파라미터 추출용 헬퍼 메서드
    private String getParams(HttpServletRequest req) {
        StringBuilder params = new StringBuilder();
        Enumeration<String> keys = req.getParameterNames();
        while (keys.hasMoreElements()) {
            String key = keys.nextElement();
            params.append("- ").append(key).append(" : ").append(req.getParameter(key)).append("\n");
        }
        return params.length() == 0 ? "No Parameters" : params.toString();
    }

    // 5. @RequestParam 검증 예외 처리
    @ExceptionHandler(jakarta.validation.ConstraintViolationException.class)
    public ResponseEntity<ApiResponse<Void>> handleConstraintViolationException(jakarta.validation.ConstraintViolationException e) {
        String errorMessage = e.getConstraintViolations().iterator().next().getMessage();
        log.warn("Constraint Violation : {}", errorMessage);

        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.fail(ErrorCode.INVALID_INPUT_VALUE, errorMessage));
    }

    // 6. @RequestParam 검증 예외 처리 (Spring Boot 3 최신 반영)
    @ExceptionHandler(org.springframework.web.method.annotation.HandlerMethodValidationException.class)
    public ResponseEntity<ApiResponse<Void>> handleHandlerMethodValidationException(org.springframework.web.method.annotation.HandlerMethodValidationException e) {
        String errorMessage = e.getAllErrors().get(0).getDefaultMessage();
        log.warn("Parameter Validation Exception : {}", errorMessage);
        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.fail(ErrorCode.INVALID_INPUT_VALUE, errorMessage));
    }

}