package com.codelab.core.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record AnswerCreateRequest(
        @NotBlank
        @Size(max = 5000)
        String answerBody,

        @NotNull
        Long questionId
) {
}
