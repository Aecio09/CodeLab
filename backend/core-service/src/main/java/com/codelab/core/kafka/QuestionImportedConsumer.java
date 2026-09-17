package com.codelab.core.kafka;

import com.codelab.core.entities.Question;
import com.codelab.core.repositories.QuestionRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Component
public class QuestionImportedConsumer {

    private final QuestionRepository questionRepository;
    private final ObjectMapper objectMapper;

    public QuestionImportedConsumer(QuestionRepository questionRepository, ObjectMapper objectMapper) {
        this.questionRepository = questionRepository;
        this.objectMapper = objectMapper;
    }

    @KafkaListener(topics = "questions.imported", groupId = "codelab-core")
    public void consume(String message) {
        try {
            JsonNode root = objectMapper.readTree(message);
            JsonNode items = root.has("questions") ? root.get("questions") : root;

            if (items.isArray()) {
                for (JsonNode node : items) {
                    saveQuestionIfAbsent(node);
                }
            } else if (items.has("title") || items.has("questionBody")) {
                saveQuestionIfAbsent(items);
            }
        } catch (Exception e) {
            System.err.println("[QuestionImportedConsumer] Erro ao processar questions.imported: " + e.getMessage());
        }
    }

    private void saveQuestionIfAbsent(JsonNode node) {
        String body = node.has("title") ? node.get("title").asText() : node.get("questionBody").asText();
        if (questionRepository.existsByQuestionBody(body)) {
            return;
        }

        Question q = new Question();
        q.setQuestionBody(body);

        String typeStr = node.has("questionType") ? node.get("questionType").asText() :
                         (node.has("type") ? node.get("type").asText() : "PRACTICAL");
        try {
            q.setType(Question.QuestionType.valueOf(typeStr.toUpperCase()));
        } catch (Exception e) {
            q.setType(Question.QuestionType.PRACTICAL);
        }

        String diffStr = node.has("difficulty") ? node.get("difficulty").asText() : "MEDIUM";
        try {
            q.setDifficulty(Question.DifficultyLevel.valueOf(diffStr.toUpperCase()));
        } catch (Exception e) {
            q.setDifficulty(Question.DifficultyLevel.MEDIUM);
        }

        if (node.has("requiredUsage") && !node.get("requiredUsage").isNull()) {
            try {
                q.setRequiredUsage(Question.RequiredUsage.valueOf(node.get("requiredUsage").asText().toUpperCase()));
            } catch (Exception ignored) {}
        }

        String topicStr = node.has("topic") ? node.get("topic").asText() : "OPERADORES_TIPOS_E_VARIAVEIS";
        try {
            q.setTopic(Question.Topics.valueOf(topicStr.toUpperCase()));
        } catch (Exception e) {
            q.setTopic(Question.Topics.OPERADORES_TIPOS_E_VARIAVEIS);
        }

        if (node.has("starterCode")) {
            q.setStarterCode(node.get("starterCode").asText());
        }

        questionRepository.save(q);
        System.out.println("[QuestionImportedConsumer] Nova questão inserida via ETL: " + body);
    }
}
