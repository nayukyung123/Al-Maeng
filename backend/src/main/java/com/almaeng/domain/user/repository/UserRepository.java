package com.almaeng.domain.user.repository;

import com.almaeng.domain.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    @Query("SELECT u FROM User u JOIN u.socialAccounts sa WHERE sa.providerId = :providerId")
    Optional<User> findByProviderId(@Param("providerId") String providerId);

    // 탈퇴 여부(is_deleted) 상관없이 닉네임 존재 여부만 확인
    boolean existsByNickname(String nickname);

    // 활성 유저 중 닉네임이 같고 id가 다른 행이 있는지 (프로필 수정 시 타인과 충돌 검사)
    boolean existsByNicknameAndIdNot(String nickname, Long id);
}