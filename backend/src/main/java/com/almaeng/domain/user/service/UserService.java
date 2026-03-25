package com.almaeng.domain.user.service;

import com.almaeng.domain.auth.service.AuthService;
import com.almaeng.domain.genre.entity.Genre;
import com.almaeng.domain.genre.repository.GenreRepository;
import com.almaeng.domain.user.dto.UserProfileResponse;
import com.almaeng.domain.user.dto.UserProfileUpdateRequest;
import com.almaeng.domain.user.entity.User;
import com.almaeng.domain.user.entity.UserGenre;
import com.almaeng.domain.user.repository.UserGenreRepository;
import com.almaeng.domain.user.repository.UserRepository;
import com.almaeng.global.error.ApiException;
import com.almaeng.global.error.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UserService {
    private final UserRepository userRepository;
    private final UserGenreRepository userGenreRepository;
    private final GenreRepository genreRepository;
    private final AuthService authService;

    // 프로필 조회
    @Transactional(readOnly = true)
    public UserProfileResponse getUserProfile(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ApiException(ErrorCode.USER_NOT_FOUND));

        List<Long> tasteData = userGenreRepository.findAllByUserId(userId).stream()
                .map(userGenre -> userGenre.getGenre().getId())
                .toList();

        return new UserProfileResponse(
                user.getNickname(),
                user.getProfileImageUrl(),
                user.getBirthYear(),
                user.getGender(),
                tasteData
        );
    }

    // 프로필 수정
    @Transactional
    public void updateUserProfile(Long userId, UserProfileUpdateRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ApiException(ErrorCode.USER_NOT_FOUND));

        authService.validateNicknameForProfileUpdate(userId, request.nickname(), user.getNickname());

        // 1. 기본 프로필 정보 업데이트
        user.updateProfile(
                request.nickname(),
                request.birthYear(),
                request.gender(),
                request.profileImageUrl()
        );

        // 2. 취향 데이터 업데이트: 전체 삭제 후 데이터 삽입
        if (request.tasteData() != null) {
            userGenreRepository.deleteAllByUserId(userId);

            if (!request.tasteData().isEmpty()) {
                List<Genre> genres = genreRepository.findAllById(request.tasteData());

                if (genres.size() != request.tasteData().size()) {
                    throw new ApiException(ErrorCode.INVALID_GENRE_ID);
                }

                List<UserGenre> newUserGenres = genres.stream()
                        .map(genre -> UserGenre.builder()
                                .user(user)
                                .genre(genre)
                                .build())
                        .toList();

                userGenreRepository.saveAll(newUserGenres);
            }
        }
    }

    //회원 탈퇴
    @Transactional
    public void deleteUser(Long userId, String accessToken) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ApiException(ErrorCode.USER_NOT_FOUND));

        authService.invalidateSession(accessToken, userId);
        userRepository.delete(user);
    }
}
