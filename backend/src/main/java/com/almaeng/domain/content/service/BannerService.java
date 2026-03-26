package com.almaeng.domain.content.service;

import com.almaeng.domain.content.dto.BannerResponse;
import com.almaeng.domain.content.repository.TopContentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class BannerService {
    private final TopContentRepository topContentRepository;

    public List<BannerResponse> getBanners() {
        return topContentRepository.findTopBanners();
    }
}