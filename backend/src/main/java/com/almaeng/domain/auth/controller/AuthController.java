package com.almaeng.domain.auth.controller;

import com.almaeng.domain.auth.dto.*;
import com.almaeng.domain.auth.service.AuthService;
import com.almaeng.global.common.ApiResponse;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
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

    @GetMapping("/check-nickname")
    public ResponseEntity<ApiResponse<NicknameCheckResponse>> checkNickname(
            @RequestParam
            @NotBlank(message = "닉네임을 입력해주세요.")
            @Size(min = 2, max = 10, message = "닉네임은 2자 이상, 10자 이하여야 합니다.")
            @Pattern(regexp = "^[가-힣a-zA-Z0-9]+$", message = "닉네임은 특수문자나 띄어쓰기를 포함할 수 없습니다.")
            String nickname
    ) {
        boolean isAvailable = authService.checkNicknameAvailability(nickname);

        NicknameCheckResponse responseDto = new NicknameCheckResponse(isAvailable);
        return ResponseEntity.ok(ApiResponse.success(responseDto));
    }

    @PostMapping("/signup")
    public ResponseEntity<ApiResponse<SignupResponse>> signup(
            @AuthenticationPrincipal Long userId,
            @Valid @RequestBody SignupRequest request
    ) {
        SignupResponse response = authService.signup(userId, request);

        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
