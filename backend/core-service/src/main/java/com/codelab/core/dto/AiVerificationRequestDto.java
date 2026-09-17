package com.codelab.core.dto;

public record AiVerificationRequestDto(
        Long answerId,
        Long questionId,
        String answerBody,
        String questionBody,
        String questionType,
        String difficulty,
        String requiredUsage,
        String topic
) {}
