package com.almaeng.domain.user.entity;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Table;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "users")
@SQLDelete(sql = "UPDATE users SET is_deleted = true WHERE id = ?") // Soft Delete 처리 (물리 삭제 방지)
@SQLRestriction("is_deleted = false") // 탈퇴 유저 조회 자동 제외
@DynamicUpdate // 변경된 컬럼만 부분 UPDATE
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tier_id", nullable = false)
    private Tier tier;

    @Column(length = 100, nullable = false)
    private String nickname;

    @Column(name = "profile_image_url", columnDefinition = "TEXT")
    private String profileImageUrl;

    @Column(name = "birth_year")
    private Integer birthYear;

    @Enumerated(EnumType.ORDINAL)
    @Column(name = "gender")
    private Gender gender;

    @Column(name = "completed_count")
    private Integer completedCount = 0; // 완독 권수 기본값 세팅

    @Column(name = "preference_count")
    private Integer preferenceCount = 0; // 찜 권수 기본값 세팅

    @Column(name = "embedding_vector", columnDefinition = "vector")
    @ColumnTransformer(write = "?::vector")
    private String embeddingVector;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "is_deleted", nullable = false)
    private Boolean isDeleted = false; // 회원 탈퇴 시 true 로 변경

    // 소셜 계정과의 1:N 양방향 매핑
    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<SocialAccount> socialAccounts = new ArrayList<>();

    @Builder
    public User(Tier tier, String nickname, String profileImageUrl, Integer birthYear, Gender gender) {
        this.tier = tier;
        this.nickname = nickname;
        this.profileImageUrl = profileImageUrl;
        this.birthYear = birthYear;
        this.gender = gender;
        this.completedCount = 0;
        this.preferenceCount = 0;
        this.isDeleted = false;
    }

    // 회원 탈퇴를 위한 메타데이터 익명화 및 소셜 연동 해제
    public void deactivate(String anonymousNickname) {
        this.nickname = anonymousNickname;
        this.socialAccounts.clear();
        this.isDeleted = true;
    }

    // 처음 소셜 로그인 시 NOT NULL을 피하기 위한 임시 유저 생성기
    public static User createOAuthTempUser(String provider, Tier defaultTier) {
        String tempNickname = provider.toUpperCase() + "_" + UUID.randomUUID().toString().substring(0, 8);
        return User.builder()
                .tier(defaultTier) // 임시 유저도 기본 티어는 있어야 함
                .nickname(tempNickname)
                .build();
    }

    // 온보딩 완료를 위한 비즈니스 메서드
    public void completeOnboarding(String nickname, String profileImageUrl, Integer birthYear, Gender gender) {
        this.nickname = nickname;
        this.profileImageUrl = normalizeProfileImageUrlForStorage(profileImageUrl);
        this.birthYear = birthYear;
        this.gender = gender;
    }

    // 가입한 사용자 중 프로필 이미지가 더미데이터로 들어간 경우 기본 이미지로 보이도록 하는 메서드
    private static String normalizeProfileImageUrlForStorage(String url) {
        if (url == null || url.isBlank()) {
            return null;
        }
        String trimmed = url.trim();
        if ("https://example.com/dummy.jpg".equals(trimmed)) {
            return null;
        }
        return url;
    }

    // 프로필 수정을 위한 메서드
    public void updateProfile(String nickname, Integer birthYear, Gender gender, String profileImageUrl) {
        if (nickname != null) this.nickname = nickname;
        if (birthYear != null) this.birthYear = birthYear;
        if (gender != null) this.gender = gender;
        // 프론트가 빈 문자열("")을 보내면 null로 처리해 이미지 삭제
        if (profileImageUrl != null) {
            this.profileImageUrl = normalizeProfileImageUrlForStorage(profileImageUrl);
        }
    }

    // 완독 권수 및 티어 동기화 메서드
    public void updateTierAndCount(Tier newTier, Integer newCompletedCount) {
        if (newTier != null) {
            this.tier = newTier;
        }
        if (newCompletedCount != null) {
            this.completedCount = newCompletedCount;
        }
    }
}