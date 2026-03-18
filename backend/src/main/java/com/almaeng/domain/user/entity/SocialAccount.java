package com.almaeng.domain.user.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "social_accounts", uniqueConstraints = {
        // 같은 소셜사(provider)의 같은 고유ID(provider_id)는 DB에 딱 1개만 존재해야 한다
        // '회원가입' 버튼 두 번 연속 눌렀을 때 중복 저장 방지
        @UniqueConstraint(
                name = "uk_social_account_provider_id",
                columnNames = {"provider", "provider_id"}
        )
})
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class SocialAccount {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false, length = 20)
    private String provider; // KAKAO, GOOGLE, NAVER

    @Column(name = "provider_id", nullable = false)
    private String providerId;

    @Builder
    public SocialAccount(User user, String provider, String providerId) {
        this.user = user;
        this.provider = provider;
        this.providerId = providerId;
    }
}
