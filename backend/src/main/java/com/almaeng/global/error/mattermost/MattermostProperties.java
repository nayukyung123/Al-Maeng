package com.almaeng.global.error.mattermost;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@Component
@Getter
@Setter
@ConfigurationProperties(prefix = "notification.mattermost")
public class MattermostProperties {
    private boolean enabled;
    private String webhookUrl;
    private String channel;
    private String pretext;
    private String color = "#ff5d52";
    private String authorName;
    private String authorIcon;
    private String title;
    private String text = "";
    private String footer = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm"));
}