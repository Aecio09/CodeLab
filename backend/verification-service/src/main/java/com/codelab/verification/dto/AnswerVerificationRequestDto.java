package com.codelab.verification.dto;

public record AnswerVerificationRequestDto(
        Long answerId,
        Long questionId,
        String answerBody,
        String questionBody,
        String questionType,
        String difficulty,
        String requiredUsage,
        String topic
) {
}
