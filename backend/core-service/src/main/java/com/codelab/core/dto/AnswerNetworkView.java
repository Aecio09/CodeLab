package com.codelab.core.dto;

import com.codelab.core.entities.AnswerNetwork;
import com.codelab.core.entities.VerificationStatus;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

public record AnswerNetworkView(
        Long id,
        VerificationStatus verificationStatus,
        JsonNode answer,
        Long userId,
        String userEmail,
        Long questionId,
        String questionTitle) {

    public static AnswerNetworkView from(AnswerNetwork answer, ObjectMapper mapper) {
        JsonNode answerNode = null;
        try {
            answerNode = mapper.readTree(answer.getAnswer());
        } catch (Exception ignored) {
        }
        return new AnswerNetworkView(
                answer.getId(),
                answer.getVerificationStatus(),
                answerNode,
                answer.getUser() == null ? null : answer.getUser().getId(),
                answer.getUser() == null ? null : answer.getUser().getEmail(),
                answer.getQuestion() == null ? null : answer.getQuestion().getId(),
                answer.getQuestion() == null ? null : answer.getQuestion().getTitle());
    }
}