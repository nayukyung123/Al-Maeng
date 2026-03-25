package com.almaeng.domain.user.repository;

import com.almaeng.domain.user.entity.UserGenre;
import com.almaeng.domain.user.entity.UserGenreId;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserGenreRepository extends JpaRepository<UserGenre, UserGenreId> {
}