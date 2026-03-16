package com.almaeng.global.error.mattermost;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.io.PrintWriter;
import java.io.StringWriter;
import java.util.ArrayList;
import java.util.List;

public class MattermostMessageDto {

    @Getter
    public static class Attachments {
        private Props props;
        private List<Attachment> attachments;

        public Attachments() {
            attachments = new ArrayList<>();
        }

        public Attachments(Attachment attachment) {
            this();
            this.attachments.add(attachment);
        }

        public void addProps(Exception e) {
            props = new Props(e);
        }
    }

    @Getter
    @AllArgsConstructor
    @Builder
    public static class Attachment {
        private String channel;
        private String pretext;
        private String color;

        @JsonProperty("author_name")
        private String authorName;

        @JsonProperty("author_icon")
        private String authorIcon;

        private String title;
        private String text;
        private String footer;

        public Attachment addExceptionInfo(Exception e, String uri, String params) {
            this.title = e.getClass().getSimpleName();

            this.text = "**Request URL**\n" + uri + "\n\n" +
                    "**Parameters**\n" + params + "\n\n" +
                    "**Error Message**\n```\n" + e.getMessage() + "\n```\n";
            return this;
        }
    }

    @Getter
    @NoArgsConstructor
    public static class Props {
        private String card;

        public Props(Exception e) {
            StringWriter sw = new StringWriter();
            e.printStackTrace(new PrintWriter(sw));

            String stackTrace = sw.toString();
            // Mattermost 길이 제한 방지
            if (stackTrace.length() > 3000) {
                stackTrace = stackTrace.substring(0, 3000) + "\n... (생략됨)";
            }

            this.card = "**Stack Trace**\n\n```java\n" + stackTrace + "\n```";
        }
    }
}