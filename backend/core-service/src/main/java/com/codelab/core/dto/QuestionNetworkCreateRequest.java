package com.codelab.core.dto;

import com.codelab.core.entities.QuestionNetwork;
import com.fasterxml.jackson.databind.JsonNode;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record QuestionNetworkCreateRequest(

        @NotBlank
        @Size(max = 3000)
        String title,

        @NotNull
        JsonNode scenery,

        @NotNull
        JsonNode sceneryAnswers,

        @NotNull
        QuestionNetwork.QuestionTypeNetwork type,

        @NotNull
        QuestionNetwork.QuestionTopicNetwork topic,

        @NotNull
        QuestionNetwork.QuestionDifficultyNetwork difficulty

) {
}
