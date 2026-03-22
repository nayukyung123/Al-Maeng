package com.almaeng.domain.user.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "tiers")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Tier {

    @Id
    @Column(name = "id")
    private Integer id;

    @Column(name = "tier_name", length = 50, nullable = false)
    private String tierName;

    @Column(name = "min_exp", nullable = false)
    private Integer minExp = 0;
}
