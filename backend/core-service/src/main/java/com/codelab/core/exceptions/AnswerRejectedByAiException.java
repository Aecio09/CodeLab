package com.codelab.core.exceptions;

public class AnswerRejectedByAiException extends RuntimeException {
    private final String aiMessage;

    public AnswerRejectedByAiException(String aiMessage) {
        super(aiMessage);
        this.aiMessage = aiMessage;
    }

    public String getAiMessage() {
        return aiMessage;
    }
}
