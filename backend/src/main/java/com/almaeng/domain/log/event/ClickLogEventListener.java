package com.almaeng.domain.log.event;

import com.almaeng.domain.book.entity.Book;
import com.almaeng.domain.book.repository.BookRepository;
import com.almaeng.domain.log.entity.ClickLog;
import com.almaeng.domain.log.repository.ClickLogRepository;
import com.almaeng.domain.user.entity.User;
import com.almaeng.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Component
@RequiredArgsConstructor
public class ClickLogEventListener {

    private final ClickLogRepository clickLogRepository;
    private final UserRepository userRepository;
    private final BookRepository bookRepository;

    @Async
    @EventListener
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void handleUserAction(UserActionEvent event) {
        try {
            User user = userRepository.getReferenceById(event.userId());
            Book book = bookRepository.getReferenceById(event.bookId());

            ClickLog clickLog = ClickLog.create(user, book, event);

            clickLogRepository.save(clickLog);
            log.info("🎯 [ClickLog Saved] User: {}, Action: {}, Source: {}", event.userId(), event.action(), event.source());

        } catch (Exception e) {
            log.error("🚨 Failed to save click log asynchronously", e);
        }
    }
}
