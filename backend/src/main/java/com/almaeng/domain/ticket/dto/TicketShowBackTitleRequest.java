package com.almaeng.domain.ticket.dto;

import jakarta.validation.constraints.NotNull;

public record TicketShowBackTitleRequest(
        @NotNull Boolean showBackTitle
) {}
