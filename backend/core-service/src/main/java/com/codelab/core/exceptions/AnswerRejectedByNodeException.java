package com.codelab.core.exceptions;

public class AnswerRejectedByNodeException extends RuntimeException {
    private final String nodeMessage;

    public AnswerRejectedByNodeException(String nodeMessage) {
        super(nodeMessage);
        this.nodeMessage = nodeMessage;
    }

    public String getNodeMessage() {
        return nodeMessage;
    }
}
