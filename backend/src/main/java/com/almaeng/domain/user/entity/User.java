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

    @Column(name = "gender")
    private Integer gender;

    @Column(name = "completed_count")
    private Integer completedCount = 0; // 완독 권수 기본값 세팅

    @Column(name = "preference_count")
    private Integer preferenceCount = 0; // 찜 권수 기본값 세팅

    @Column(name = "embedding_vector", columnDefinition = "vector")
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
    public User(Tier tier, String nickname, String profileImageUrl, Integer birthYear, Integer gender) {
        this.tier = tier;
        this.nickname = nickname;
        this.profileImageUrl = profileImageUrl;
        this.birthYear = birthYear;
        this.gender = gender;
        this.completedCount = 0;
        this.preferenceCount = 0;
        this.isDeleted = false;
    }

    // 처음 소셜 로그인 시 NOT NULL을 피하기 위한 임시 유저 생성기
    public static User createOAuthTempUser(String provider, Tier defaultTier) {
        String tempNickname = provider.toUpperCase() + "_" + UUID.randomUUID().toString().substring(0, 8);
        return User.builder()
                .tier(defaultTier) // 임시 유저도 기본 티어는 있어야 함
                .nickname(tempNickname)
                .build();
    }
}