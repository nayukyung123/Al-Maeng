package com.almaeng.domain.log.controller;

import com.almaeng.domain.log.dto.ClickLogRequest;
import com.almaeng.domain.log.event.UserActionEvent;
import com.almaeng.global.common.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/logs")
@RequiredArgsConstructor
public class ClickLogController {

    private final ApplicationEventPublisher eventPublisher;

    @PostMapping("/views")
    public ResponseEntity<ApiResponse<Void>> logViewAction(
            @AuthenticationPrincipal Long userId,
            @Valid @RequestBody ClickLogRequest request) {

        if (userId != null) {
            eventPublisher.publishEvent(new UserActionEvent(userId, request.bookId(), request.source(), "view"));
        }

        return ResponseEntity.ok(ApiResponse.success(null));
    }
}
