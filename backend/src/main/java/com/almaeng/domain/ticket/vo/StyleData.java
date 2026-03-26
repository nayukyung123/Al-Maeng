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
}