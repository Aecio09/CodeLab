package com.codelab.core.kafka;

import com.codelab.core.entities.Answer;
import com.codelab.core.entities.Question;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

/**
 * Publica o evento answers.imported quando uma resposta é submetida.
 * O verification-service consome esse tópico e publica o resultado em answers.verified.
 */
@Service
public class AnswerEventProducer {

    private static final String TOPIC = "answers.imported";

    private final KafkaTemplate<String, String> kafkaTemplate;
    private final ObjectMapper objectMapper;

    public AnswerEventProducer(KafkaTemplate<String, String> kafkaTemplate, ObjectMapper objectMapper) {
        this.kafkaTemplate = kafkaTemplate;
        this.objectMapper = objectMapper;
    }

    public void publishAnswerImported(Answer answer) {
        try {
            Question question = answer.getQuestion();

            Map<String, Object> event = new HashMap<>();
            event.put("answerId", answer.getId());
            event.put("answerBody", answer.getAnswerBody());
            event.put("questionId", question.getId());
            event.put("questionBody", question.getQuestionBody());
            event.put("questionType", question.getType() != null ? question.getType().name() : null);
            event.put("difficulty", question.getDifficulty() != null ? question.getDifficulty().name() : null);
            event.put("requiredUsage", question.getRequiredUsage());
            event.put("topic", question.getTopic() != null ? question.getTopic().name() : null);

            String json = objectMapper.writeValueAsString(event);
            kafkaTemplate.send(TOPIC, answer.getId().toString(), json);
        } catch (Exception e) {
            System.err.println("[AnswerEventProducer] Erro ao publicar answers.imported para answerId="
                    + answer.getId() + ": " + e.getMessage());
        }
    }
}
