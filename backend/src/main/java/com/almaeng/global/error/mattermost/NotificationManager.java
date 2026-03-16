package com.almaeng.global.error.mattermost;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class NotificationManager {

    private final MattermostSender mmSender;

    @Async
    public void sendNotification(Exception e, String uri, String params) {
        log.info("#### Async Notification Dispatcher Started");
        mmSender.sendMessage(e, uri, params);
    }
}