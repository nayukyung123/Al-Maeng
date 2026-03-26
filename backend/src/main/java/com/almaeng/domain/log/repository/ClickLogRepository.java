package com.almaeng.domain.log.repository;

import com.almaeng.domain.log.entity.ClickLog;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ClickLogRepository extends JpaRepository<ClickLog, Long> {

}
