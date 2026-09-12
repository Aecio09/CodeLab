package com.codelab.verification.exceptions;

public class AnswerRejectedByNodeException extends RuntimeException {
    private final String nodeMessage;

    public AnswerRejectedByNodeException(String nodeMessage) {
        super("Answer rejected by verification service: " + nodeMessage);
        this.nodeMessage = nodeMessage;
    }

    public String getNodeMessage() {
        return nodeMessage;
    }
}

