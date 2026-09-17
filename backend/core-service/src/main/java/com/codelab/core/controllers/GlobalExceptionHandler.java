package com.codelab.core.controllers;

import com.codelab.core.exceptions.AnswerRejectedByAiException;
import com.codelab.core.exceptions.AnswerRejectedByNodeException;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(AnswerRejectedByNodeException.class)
    public ResponseEntity<ErrorResponse> handleAnswerRejected(AnswerRejectedByNodeException ex) {
        ErrorResponse error = new ErrorResponse(
                "ANSWER_REJECTED",
                ex.getNodeMessage(),
                422
        );
        return ResponseEntity.status(422).body(error);
    }

    @ExceptionHandler(AnswerRejectedByAiException.class)
    public ResponseEntity<ErrorResponse> handleAnswerRejectedByAi(AnswerRejectedByAiException ex) {
        ErrorResponse error = new ErrorResponse(
                "ANSWER_REJECTED_BY_AI",
                ex.getAiMessage(),
                422
        );
        return ResponseEntity.status(422).body(error);
    }

    public record ErrorResponse(
            String code,
            String message,
            int status
    ) {}
}


