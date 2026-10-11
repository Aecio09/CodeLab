package com.codelab.core.dto;

import jakarta.validation.constraints.NotBlank;

public record SubmitNetworkQuestionRequest(
        @NotBlank
        String sessionId
) {
}