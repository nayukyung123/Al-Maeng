package com.almaeng.domain.user.repository;

import com.almaeng.domain.user.entity.Tier;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TierRepository extends JpaRepository<Tier, Integer> {

}
