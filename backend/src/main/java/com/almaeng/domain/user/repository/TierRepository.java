package com.almaeng.domain.user.repository;

import com.almaeng.domain.user.entity.Tier;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface TierRepository extends JpaRepository<Tier, Integer> {

    Optional<Tier> findTopByMinExpLessThanEqualOrderByMinExpDesc(Integer exp);

    Optional<Tier> findFirstByMinExpGreaterThanOrderByMinExpAsc(Integer exp);
}
