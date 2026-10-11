package com.codelab.core.dto;

import com.fasterxml.jackson.databind.JsonNode;
import jakarta.validation.constraints.NotNull;

public record AnswerNetworkCreateRequest(
        @NotNull
        JsonNode answer,

        @NotNull
        Long questionId
) {
}