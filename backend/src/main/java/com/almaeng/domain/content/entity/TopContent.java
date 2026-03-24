package com.almaeng.domain.content.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "top_contents")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class TopContent {

    @Id
    @Column(name = "content_id")
    private Long contentId;

    @OneToOne(fetch = FetchType.LAZY)
    @MapsId
    @JoinColumn(name = "content_id")
    private Content content;

    @Column(name = "rank")
    private Integer rank;

    @Column(name = "type", length = 20)
    private String type;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

}
