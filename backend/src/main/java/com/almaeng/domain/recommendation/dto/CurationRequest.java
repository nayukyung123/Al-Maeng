package com.almaeng.domain.recommendation.dto;

import com.almaeng.domain.recommendation.type.LengthType;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class CurationRequest {
    private Long contentId;
    private LengthType bookLength;
}
