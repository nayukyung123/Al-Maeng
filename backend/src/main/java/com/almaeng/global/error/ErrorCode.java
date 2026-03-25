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
    INVALID_GENDER_VALUE(HttpStatus.BAD_REQUEST, "U003", "유효하지 않은 성별 값입니다."),
    TASTE_DATA_REQUIRED(HttpStatus.BAD_REQUEST, "U004", "최소 하나 이상의 취향 데이터를 선택해야 합니다."),
    UNAUTHORIZED_ACCESS(HttpStatus.UNAUTHORIZED, "A001", "인증되지 않은 접근입니다."),
    INVALID_PROVIDER_OR_TOKEN(HttpStatus.BAD_REQUEST, "A002", "지원하지 않는 소셜 로그인 제공자이거나 토큰이 누락되었습니다."),
    INVALID_SOCIAL_TOKEN(HttpStatus.UNAUTHORIZED, "A003", "유효하지 않거나 만료된 소셜 토큰입니다."),

    // [도서 / 큐레이션 에러]
    BOOK_NOT_FOUND(HttpStatus.NOT_FOUND, "B001", "도서 정보를 찾을 수 없습니다."),
    CURATION_FAILED(HttpStatus.INTERNAL_SERVER_ERROR, "B002", "추천 도서를 가져오는 데 실패했습니다."),
    GENRE_NOT_FOUND(HttpStatus.NOT_FOUND, "B003", "존재하지 않는 장르입니다."),
    INVALID_GENRE_ID(HttpStatus.BAD_REQUEST, "B004", "유효하지 않은 장르 ID가 포함되어 있습니다."),

    // [티켓 / 완독 기록 에러]
    ALREADY_COMPLETED_BOOK(HttpStatus.BAD_REQUEST, "T001", "이미 완독 리스트에 추가된 도서입니다."),
    COMPLETED_BOOK_NOT_FOUND(HttpStatus.NOT_FOUND, "T002", "완독 리스트에 존재하지 않는 도서입니다."),
    TICKET_ALREADY_EXIST(HttpStatus.BAD_REQUEST, "T003", "이미 티켓이 발급된 도서입니다."),
    TICKET_NOT_FOUND(HttpStatus.NOT_FOUND, "T004", "존재하지 않는 티켓입니다."),
    TICKET_ACCESS_DENIED(HttpStatus.FORBIDDEN, "T005", "해당 티켓에 대한 접근 권한이 없습니다."),
    COMPLETED_BOOK_HAS_TICKET(HttpStatus.CONFLICT, "T006", "발급된 티켓이 존재하여 삭제할 수 없습니다."),

    // [리뷰 에러]
    ALREADY_REVIEWED_BOOK(HttpStatus.BAD_REQUEST, "R001", "이미 리뷰를 작성한 도서입니다."),
    NOT_COMPLETED_BOOK(HttpStatus.FORBIDDEN, "R002", "도서를 완독한 사용자만 리뷰를 작성할 수 있습니다."),
    REVIEW_NOT_FOUND(HttpStatus.NOT_FOUND, "R003", "존재하지 않는 리뷰입니다."),
    NOT_REVIEW_OWNER(HttpStatus.FORBIDDEN, "R004", "해당 리뷰에 대한 권한이 없습니다."),

    // [티어]
    TIER_NOT_FOUND(HttpStatus.NOT_FOUND, "TR001", "해당 티어 정보를 찾을 수 없습니다."),

    // [찜 목록]
    ALREADY_WISHED_BOOK(HttpStatus.BAD_REQUEST, "W001", "이미 찜한 도서입니다."),
    WISHLIST_NOT_FOUND(HttpStatus.NOT_FOUND, "W002", "찜 목록에 존재하지 않는 도서입니다.");

    private final HttpStatus status;
    private final String code;
    private final String message;
}