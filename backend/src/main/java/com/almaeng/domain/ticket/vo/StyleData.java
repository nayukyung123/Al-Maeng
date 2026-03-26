package com.almaeng.domain.ticket.vo;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
public class StyleData {
    private String orientation;
    private String coverShape;
    private String typography;
    private String ticketColor;
    /** null·미전송 시 프론트에서 뒷면 제목 표시(true)로 간주 */
    private Boolean showBackTitle;
}