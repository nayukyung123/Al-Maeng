package com.almaeng.domain.auth.controller;

import com.almaeng.domain.auth.dto.LoginRequest;
import com.almaeng.domain.auth.dto.LoginResponse;
import com.almaeng.domain.auth.service.AuthService;
import com.almaeng.global.common.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {
    private final AuthService authService;

    @PostMapping("/login/{provider}")
    public ApiResponse<LoginResponse> login(
            @PathVariable String provider,
            @RequestBody @Valid LoginRequest request) {

        LoginResponse response = authService.login(provider, request.accessToken());
        return ApiResponse.success(response);
    }
}
