package com.almaeng.domain.log.event;

public record UserActionEvent (
        Long userId,
        Long bookId,
        String source,
        String action
){

}
