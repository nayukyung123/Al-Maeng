package com.almaeng.domain.user.entity;

import com.fasterxml.jackson.annotation.JsonCreator;
import lombok.Getter;
import lombok.RequiredArgsConstructor;

import java.util.Locale;

@Getter
@RequiredArgsConstructor
public enum Gender {
    MALE("남성"),
    FEMALE("여성");

    private final String description;

    // 프론트에서 넘어오는 값이 "MALE"/"FEMALE" 뿐 아니라 "male"/"female", "남성"/"여성" 형태여도 허용
    // (그 외 값은 "성별 값 형식이 잘못되었습니다"로 명확히 실패)
    @JsonCreator
    public static Gender from(String value) {
        if (value == null) {
            return null;
        }
        String v = value.trim();
        if (v.isEmpty()) {
            return null;
        }

        String upper = v.toUpperCase(Locale.ROOT);
        return switch (upper) {
            case "MALE", "남성" -> MALE;
            case "FEMALE", "여성" -> FEMALE;
            default -> throw new IllegalArgumentException("성별 값 형식이 잘못되었습니다");
        };
    }
}