package com.almaeng.global.infra.oauth;

import com.almaeng.global.error.ApiException;
import com.almaeng.global.error.ErrorCode;
import com.fasterxml.jackson.databind.JsonNode;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatusCode;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.time.Duration;

@Slf4j
@Component
public class GoogleOAuthClient extends AbstractOAuthClient {

    public GoogleOAuthClient(
            WebClient.Builder webClientBuilder,
            @Value("${oauth.google.user-info-uri}") String baseUrl) {
        super(webClientBuilder.baseUrl(baseUrl).build());
    }

    @Override
    public String getProvider() {
        return "GOOGLE";
    }

    @Override
    public String getProviderId(String accessToken) {
        try {
            JsonNode response = fetchUserProfile(accessToken);
            return response.get("id").asText();
        } catch (ApiException e) {
            throw e;
        } catch (Exception e) {
            throw new ApiException(ErrorCode.INTERNAL_SERVER_ERROR);
        }
    }
}
