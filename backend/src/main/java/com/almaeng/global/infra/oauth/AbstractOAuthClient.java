package com.almaeng.global.infra.oauth;

import com.almaeng.global.error.ApiException;
import com.almaeng.global.error.ErrorCode;
import com.fasterxml.jackson.databind.JsonNode;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatusCode;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.time.Duration;

@Slf4j
public abstract class AbstractOAuthClient implements OAuthClient {
    private final WebClient webClient;

    protected AbstractOAuthClient(WebClient webClient) {
        this.webClient = webClient;
    }

    // 카카오,네이버,구글이 이 메서드 공유
    protected JsonNode fetchUserProfile(String accessToken) {
        return webClient.get()
                .header("Authorization", "Bearer " + accessToken)
                .retrieve()
                .onStatus(HttpStatusCode::is4xxClientError, response -> {
                    log.warn("{} 토큰 검증 실패 (4xx)", getProvider());
                    return Mono.error(new ApiException(ErrorCode.INVALID_SOCIAL_TOKEN));
                })
                .onStatus(HttpStatusCode::is5xxServerError, response -> {
                    log.error("{} 서버 장애 발생 (5xx)", getProvider());
                    return Mono.error(new ApiException(ErrorCode.INTERNAL_SERVER_ERROR));
                })
                .bodyToMono(JsonNode.class)
                .timeout(Duration.ofSeconds(5))
                .block();
    }

}
