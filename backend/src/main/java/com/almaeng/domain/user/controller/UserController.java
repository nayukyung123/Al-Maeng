package com.almaeng.domain.user.controller;

import com.almaeng.domain.user.dto.UserProfileResponse;
import com.almaeng.domain.user.dto.UserProfileUpdateRequest;
import com.almaeng.domain.user.service.UserService;
import com.almaeng.global.common.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {
    private final UserService userService;

    // 프로필 조회
    @GetMapping("/me")
    public ApiResponse<UserProfileResponse> getMyProfile(
            @RequestParam Long userId) {
        UserProfileResponse response = userService.getUserProfile(userId);

        return ApiResponse.success(response);
    }

    // 프로필 수정
    @PatchMapping("/me")
    public ApiResponse<String> updateMyProfile(
            @RequestParam Long userId,
            @RequestBody UserProfileUpdateRequest request) {
        userService.updateUserProfile(userId, request);

        return ApiResponse.success();
    }

    // 회원 탈퇴
    @DeleteMapping("/me")
    public ApiResponse<String> deleteMyAccount(
            @RequestParam Long userId) {
        userService.deleteUser(userId);

        return ApiResponse.success();
    }
}
