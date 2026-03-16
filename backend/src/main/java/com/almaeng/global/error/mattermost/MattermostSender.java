package com.almaeng.global.error.mattermost;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

@Slf4j
@Component
@RequiredArgsConstructor
public class MattermostSender {

    private final RestTemplate restTemplate;
    private final MattermostProperties mmProperties;

    public void sendMessage(Exception exception, String uri, String params) {
        if (!mmProperties.isEnabled()) {
            return;
        }

        try {
            MattermostMessageDto.Attachment attachment = MattermostMessageDto.Attachment.builder()
                    .channel(mmProperties.getChannel())
                    .authorIcon(mmProperties.getAuthorIcon())
                    .authorName(mmProperties.getAuthorName())
                    .color(mmProperties.getColor())
                    .pretext(mmProperties.getPretext())
                    .title(mmProperties.getTitle())
                    .text(mmProperties.getText())
                    .footer(mmProperties.getFooter())
                    .build();

            attachment.addExceptionInfo(exception, uri, params);

            MattermostMessageDto.Attachments payload = new MattermostMessageDto.Attachments(attachment);
            payload.addProps(exception);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            HttpEntity<MattermostMessageDto.Attachments> entity = new HttpEntity<>(payload, headers);

            restTemplate.postForEntity(mmProperties.getWebhookUrl(), entity, String.class);
            log.info("Mattermost error notification sent successfully.");

        } catch (Exception e) {
            log.error("#### ERROR!! Mattermost Notification Failed : {}", e.getMessage());
        }
    }
}