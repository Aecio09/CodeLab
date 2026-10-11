package com.codelab.core.dto;

import com.codelab.core.entities.VerificationStatus;
import com.fasterxml.jackson.databind.JsonNode;

public record SubmitNetworkQuestionResponse(
        Long answerId,
        VerificationStatus status,
        JsonNode result
) {
}