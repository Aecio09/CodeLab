package com.codelab.verification.kafka;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

/**
 * Publica o resultado da verificação em answers.verified.
 * O core-service consome e atualiza o status da Answer no DB.
 *
 * Payload: { answerId, status, aiResult, nodeResult }
 * status = "APPROVED" | "AI_REJECTED" | "NODE_REJECTED"
 */
@Service
public class AnswerVerifiedProducer {

    private static final String TOPIC = "answers.verified";

    private final KafkaTemplate<String, String> kafkaTemplate;
    private final ObjectMapper objectMapper;

    public AnswerVerifiedProducer(KafkaTemplate<String, String> kafkaTemplate, ObjectMapper objectMapper) {
        this.kafkaTemplate = kafkaTemplate;
        this.objectMapper = objectMapper;
    }

    public void publishVerified(Long answerId, String status, String aiResult, String nodeResult) {
        try {
            Map<String, Object> event = new HashMap<>();
            event.put("answerId", answerId);
            event.put("status", status);
            if (aiResult != null) event.put("aiResult", aiResult);
            if (nodeResult != null) event.put("nodeResult", nodeResult);

            String json = objectMapper.writeValueAsString(event);
            kafkaTemplate.send(TOPIC, answerId.toString(), json);

            System.out.println("[AnswerVerifiedProducer] Publicado answers.verified: answerId=" + answerId + " status=" + status);
        } catch (Exception e) {
            System.err.println("[AnswerVerifiedProducer] Erro ao publicar answers.verified para answerId=" + answerId + ": " + e.getMessage());
        }
    }
}
