package com.almaeng.domain.user.dto;

import com.almaeng.domain.user.entity.Gender;

import java.util.List;

public class UserOnboardingRequestDto {
    private String nickname;
    private String profileImageUrl;
    private Integer birthYear;
    private Gender gender;
    private List<Long> genreIds;

}
