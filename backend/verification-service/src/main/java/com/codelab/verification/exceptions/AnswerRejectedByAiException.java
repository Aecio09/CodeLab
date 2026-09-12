package com.codelab.verification.exceptions;

public class AnswerRejectedByAiException extends RuntimeException {
    private final String aiMessage;

    public AnswerRejectedByAiException(String aiMessage) {
        super("Answer rejected by AI verification: " + aiMessage);
        this.aiMessage = aiMessage;
    }

    public String getAiMessage() {
        return aiMessage;
    }
}

