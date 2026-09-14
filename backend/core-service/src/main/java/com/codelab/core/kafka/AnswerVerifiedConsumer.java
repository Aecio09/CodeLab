package com.codelab.core.kafka;

import com.codelab.core.entities.Answer;
import com.codelab.core.entities.VerificationStatus;
import com.codelab.core.repositories.AnswerRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

/**
 * Consome o tópico answers.verified publicado pelo verification-service.
 * Atualiza o status da resposta no banco do core-service.
 */
@Component
public class AnswerVerifiedConsumer {

    private final AnswerRepository answerRepository;
    private final ObjectMapper objectMapper;

    public AnswerVerifiedConsumer(AnswerRepository answerRepository, ObjectMapper objectMapper) {
        this.answerRepository = answerRepository;
        this.objectMapper = objectMapper;
    }

    @KafkaListener(topics = "answers.verified", groupId = "codelab-core")
    public void consume(String message) {
        try {
            JsonNode node = objectMapper.readTree(message);

            Long answerId = node.get("answerId").asLong();
            String statusStr = node.get("status").asText();
            String aiResult = node.has("aiResult") ? node.get("aiResult").asText(null) : null;
            String nodeResult = node.has("nodeResult") ? node.get("nodeResult").asText(null) : null;

            VerificationStatus status;
            try {
                status = VerificationStatus.valueOf(statusStr);
            } catch (IllegalArgumentException e) {
                System.err.println("[AnswerVerifiedConsumer] Status desconhecido: " + statusStr + " para answerId=" + answerId);
                return;
            }

            answerRepository.findById(answerId).ifPresentOrElse(answer -> {
                answer.setVerificationStatus(status);
                if (aiResult != null) {
                    answer.setAiVerificationResult(aiResult);
                }
                if (nodeResult != null) {
                    answer.setNodeVerificationResult(nodeResult);
                }
                answerRepository.save(answer);
                System.out.println("[AnswerVerifiedConsumer] Answer " + answerId + " atualizada para " + status);
            }, () -> System.err.println("[AnswerVerifiedConsumer] Answer não encontrada: " + answerId));

        } catch (Exception e) {
            System.err.println("[AnswerVerifiedConsumer] Erro ao processar answers.verified: " + e.getMessage());
        }
    }
}
