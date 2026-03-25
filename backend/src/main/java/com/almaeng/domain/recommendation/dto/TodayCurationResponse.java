package com.almaeng.domain.recommendation.dto;

import com.almaeng.domain.book.dto.BookResponse;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TodayCurationResponse {
    private List<BookResponse> books;
    private int refreshCount;
    private boolean isFallback; // true면 맞춤 추천 대신 '인기 도서'를 보여줌 (프론트 UI 변경용)
    private boolean showPopup;  // 10의 배수일 때 true
    private String popupMessage;

}
