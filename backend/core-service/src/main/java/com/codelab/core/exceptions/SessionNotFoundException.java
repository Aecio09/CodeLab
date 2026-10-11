package com.codelab.core.exceptions;

public class SessionNotFoundException extends RuntimeException {

    public SessionNotFoundException(String message) {
        super(message);
    }
}