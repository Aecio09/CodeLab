package com.project._3.dto;

import com.project._3.entities.Question;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record QuestionCreateRequest(
        @NotBlank
        @Size(max = 3000)
        String questionBody,

        @NotNull
        Question.QuestionType type,

        @NotNull
        Question.DifficultyLevel difficulty,

        Question.RequiredUsage requiredUsage,

        @NotNull
        Question.Topics topic,

        @Size(max = 5000)
        String starterCode
) {
}
