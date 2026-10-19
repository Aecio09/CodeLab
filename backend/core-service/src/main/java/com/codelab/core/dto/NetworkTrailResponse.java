package com.codelab.core.dto;

import java.util.List;

/**
 * Trilha de rede do aluno: tópicos (módulos) com status e a lista de questões (labs) de cada um.
 */
public record NetworkTrailResponse(List<NetworkTrailTopic> topics) {

    public record NetworkTrailTopic(
            String topic,
            String status,              // COMPLETED, AVAILABLE, LOCKED
            int totalQuestions,
            int completedQuestions,
            List<NetworkTrailItem> questions
    ) {}

    public record NetworkTrailItem(
            Long questionId,
            String title,
            String type,                // MULTIPLE_CHOICE, PRACTICE
            String difficulty,          // EASY, MEDIUM, HARD
            String status               // COMPLETED, AVAILABLE, LOCKED
    ) {}
}
