package com.codelab.verification.kafka;

import com.codelab.verification.dto.AiVerificationRequestDto;
import com.codelab.verification.dto.AiVerificationResponseDto;
import com.codelab.verification.dto.AnswerVerificationRequestDto;
import com.codelab.verification.dto.VerificationResultDto;
import com.codelab.verification.exceptions.AnswerRejectedByNodeException;
import com.codelab.verification.services.AiVerificationService;
import com.codelab.verification.services.CodeVerificationService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

/**
 * Consome answers.imported publicado pelo core-service.
 * Executa verificação de código (Node/CodeVerificationService) e IA (Groq/AiVerificationService).
 * Publica o resultado em answers.verified via AnswerVerifiedProducer.
 *
 * Fluxo:
 *   1. core publica answers.imported (answerId + dados da questão/resposta)
 *   2. Este consumer chama CodeVerificationService → resultado de sintaxe/node
 *   3. Chama AiVerificationService (Groq) → aprovação semântica
 *   4. Publica em answers.verified: { answerId, status, aiResult, nodeResult }
 *      status = APPROVED | AI_REJECTED | NODE_REJECTED
 */
@Component
public class KafkaAnswerConsumer {

    private final AiVerificationService aiVerificationService;
    private final CodeVerificationService codeVerificationService;
    private final AnswerVerifiedProducer answerVerifiedProducer;
    private final ObjectMapper objectMapper;

    public KafkaAnswerConsumer(AiVerificationService aiVerificationService,
                               CodeVerificationService codeVerificationService,
                               AnswerVerifiedProducer answerVerifiedProducer,
                               ObjectMapper objectMapper) {
        this.aiVerificationService = aiVerificationService;
        this.codeVerificationService = codeVerificationService;
        this.answerVerifiedProducer = answerVerifiedProducer;
        this.objectMapper = objectMapper;
    }

    @KafkaListener(topics = "answers.imported", groupId = "codelab-verification")
    public void consume(String message) {
        Long answerId = null;
        try {
            JsonNode node = objectMapper.readTree(message);
            answerId = node.get("answerId").asLong();

            String answerBody = node.get("answerBody").asText();
            String questionBody = node.get("questionBody").asText();
            String questionType = node.has("questionType") ? node.get("questionType").asText(null) : null;
            String difficulty = node.has("difficulty") ? node.get("difficulty").asText(null) : null;
            String requiredUsage = node.has("requiredUsage") && !node.get("requiredUsage").isNull()
                    ? node.get("requiredUsage").asText(null) : null;
            String topic = node.has("topic") ? node.get("topic").asText(null) : null;

            System.out.println("[KafkaAnswerConsumer] Processando answerId=" + answerId);

            // Etapa 1: verificação de código via Node (apenas para PRACTICAL)
            String nodeResult = null;
            if ("PRACTICAL".equalsIgnoreCase(questionType)) {
                try {
                    AnswerVerificationRequestDto codeRequest = new AnswerVerificationRequestDto(
                            answerId,
                            node.has("questionId") ? node.get("questionId").asLong() : null,
                            answerBody,
                            questionBody,
                            questionType,
                            difficulty,
                            requiredUsage,
                            topic
                    );
                    VerificationResultDto codeVerification = codeVerificationService.verifyAnswer(codeRequest);
                    nodeResult = codeVerification != null ? codeVerification.message() : "OK";
                } catch (AnswerRejectedByNodeException e) {
                    // Falhou na verificação de código — NODE_REJECTED
                    answerVerifiedProducer.publishVerified(answerId, "NODE_REJECTED", null, e.getNodeMessage());
                    return;
                }
            }

            // Etapa 2: verificação semântica via IA (Groq)
            AiVerificationRequestDto aiRequest = new AiVerificationRequestDto(
                    answerId,
                    node.has("questionId") ? node.get("questionId").asLong() : null,
                    answerBody,
                    questionBody,
                    questionType,
                    difficulty,
                    requiredUsage,
                    topic
            );

            AiVerificationResponseDto aiResponse = aiVerificationService.verify(aiRequest);

            if (aiResponse.approved()) {
                answerVerifiedProducer.publishVerified(answerId, "APPROVED",
                        aiResponse.feedback(), nodeResult);
            } else {
                answerVerifiedProducer.publishVerified(answerId, "AI_REJECTED",
                        aiResponse.feedback(), nodeResult);
            }

        } catch (Exception e) {
            System.err.println("[KafkaAnswerConsumer] Erro ao processar answerId=" + answerId + ": " + e.getMessage());
            if (answerId != null) {
                // Em caso de erro inesperado, marca como AI_REJECTED para não deixar PENDING indefinidamente
                answerVerifiedProducer.publishVerified(answerId, "AI_REJECTED",
                        "Erro interno na verificação: " + e.getMessage(), null);
            }
        }
    }
}
