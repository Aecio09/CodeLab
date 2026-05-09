package com.project._3.dto;

import jakarta.validation.constraints.NotBlank;

public record QuestionSeedImportRequest(
        @NotBlank
        String fileName
) {
}

