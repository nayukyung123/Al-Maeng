package com.almaeng.domain.user.controller;

import com.almaeng.global.error.ApiException;
import com.almaeng.global.error.ErrorCode;
import com.almaeng.domain.user.dto.TasteReportResponse;
import com.almaeng.domain.user.dto.UserProfileResponse;
import com.almaeng.domain.user.dto.UserProfileUpdateRequest;
import com.almaeng.domain.user.service.UserService;
import com.almaeng.domain.user.service.UserTasteReportService;
import com.almaeng.global.common.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.util.StringUtils;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {
    private final UserService userService;
    private final UserTasteReportService userTasteReportService;

    // 프로필 조회
    @GetMapping("/me")
    public ApiResponse<UserProfileResponse> getMyProfile(
            @AuthenticationPrincipal Long userId) {
        UserProfileResponse response = userService.getUserProfile(userId);

        return ApiResponse.success(response);
    }

    // 취향 리포트 조회
    @GetMapping("/me/taste-report")
    public ApiResponse<TasteReportResponse> getMyTasteReport(
            @AuthenticationPrincipal Long userId) {
        TasteReportResponse response = userTasteReportService.getTasteReport(userId);

        return ApiResponse.success(response);
    }

    // 프로필 수정
    @PatchMapping("/me")
    public ApiResponse<Void> updateMyProfile(
            @AuthenticationPrincipal Long userId,
            @Valid @RequestBody UserProfileUpdateRequest request) {
        userService.updateUserProfile(userId, request);

        return ApiResponse.success();
    }

    // 회원 탈퇴
    @DeleteMapping("/me")
    public ApiResponse<Void> deleteMyAccount(
            @AuthenticationPrincipal Long userId,
            @RequestHeader("Authorization") String authorization) {
        try {
            if (!StringUtils.hasText(authorization) || !authorization.startsWith("Bearer ")) {
                throw new ApiException(ErrorCode.UNAUTHORIZED_ACCESS);
            }

            String accessToken = authorization.substring(7);
            if (!StringUtils.hasText(accessToken)) {
                throw new ApiException(ErrorCode.UNAUTHORIZED_ACCESS);
            }

            userService.deleteUser(userId, accessToken);
            return ApiResponse.success();
        } catch (ApiException e) {
            throw e;
        } catch (Exception e) {
            throw new ApiException(ErrorCode.UNAUTHORIZED_ACCESS);
        }

    }
}
