package com.almaeng.global.error;

import lombok.AllArgsConstructor;
import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
@AllArgsConstructor
public enum ErrorCode {

    // [공통 에러]
    INVALID_INPUT_VALUE(HttpStatus.BAD_REQUEST, "C001", "잘못된 입력값입니다."),
    INTERNAL_SERVER_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "C002", "서버 내부 오류가 발생했습니다."),

    // [유저 / 인증 에러]
    USER_NOT_FOUND(HttpStatus.NOT_FOUND, "U001", "존재하지 않는 사용자입니다."),
    DUPLICATE_NICKNAME(HttpStatus.CONFLICT, "U002", "이미 사용 중인 닉네임입니다."),
    UNAUTHORIZED_ACCESS(HttpStatus.UNAUTHORIZED, "A001", "인증되지 않은 접근입니다."),
    INVALID_PROVIDER_OR_TOKEN(HttpStatus.BAD_REQUEST, "A002", "지원하지 않는 소셜 로그인 제공자이거나 토큰이 누락되었습니다."),
    INVALID_SOCIAL_TOKEN(HttpStatus.UNAUTHORIZED, "A003", "유효하지 않거나 만료된 소셜 토큰입니다."),

    // [도서 / 큐레이션 에러]
    BOOK_NOT_FOUND(HttpStatus.NOT_FOUND, "B001", "도서 정보를 찾을 수 없습니다."),
    CURATION_FAILED(HttpStatus.INTERNAL_SERVER_ERROR, "B002", "추천 도서를 가져오는 데 실패했습니다."),
    ALREADY_COMPLETED_BOOK(HttpStatus.BAD_REQUEST, "B003", "이미 완독 리스트에 추가된 도서입니다."),
    COMPLETED_BOOK_NOT_FOUND(HttpStatus.NOT_FOUND, "B004", "완독 리스트에 존재하지 않는 도서입니다.");

    private final HttpStatus status;
    private final String code;
    private final String message;
}