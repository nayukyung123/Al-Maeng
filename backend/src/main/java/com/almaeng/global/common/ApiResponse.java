package com.almaeng.global.common;

import com.almaeng.global.error.ErrorCode;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor(access = AccessLevel.PRIVATE)
@JsonInclude(JsonInclude.Include.NON_NULL) // null인 필드는 JSON 응답에서 제외
public class ApiResponse<T> {
    private final boolean success; // 성공/실패 여부
    private final String code;     // "U001" 같은 커스텀 에러 코드
    private final String message;  // 에러 메시지
    private final T data;          // 실제 응답 데이터

    // 1. 성공 시 응답 (데이터 있음)
    public static <T> ApiResponse<T> success(T data) {
        return new ApiResponse<>(true, null, null, data);
    }

    // 2. 성공 시 응답 (데이터 없음 - 생성/수정/삭제 등)
    public static <T> ApiResponse<T> success() {
        return new ApiResponse<>(true, null, null, null);
    }

    // 3. 실패 시 응답 (ErrorCode Enum을 통째로 받을 때)
    public static <T> ApiResponse<T> fail(ErrorCode errorCode) {
        return new ApiResponse<>(false, errorCode.getCode(), errorCode.getMessage(), null);
    }

    // 4. 실패 시 응답 (ErrorCode 메시지를 dto에 적은 걸로 교체)
    public static <T> ApiResponse<T> fail(ErrorCode errorCode, String message) {
        return new ApiResponse<>(false, errorCode.getCode(), message,null);
    }
}
