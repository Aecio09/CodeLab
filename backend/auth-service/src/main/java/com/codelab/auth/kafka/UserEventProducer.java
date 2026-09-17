package com.codelab.auth.kafka;

import com.codelab.auth.entities.User;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Service
public class UserEventProducer {

    private final KafkaTemplate<String, String> kafkaTemplate;
    private final ObjectMapper objectMapper;

    public UserEventProducer(KafkaTemplate<String, String> kafkaTemplate, ObjectMapper objectMapper) {
        this.kafkaTemplate = kafkaTemplate;
        this.objectMapper = objectMapper;
    }

    public void publishRegistered(User user) {
        try {
            Map<String, Object> event = new HashMap<>();
            event.put("id", user.getId());
            event.put("name", user.getName());
            event.put("email", user.getEmail());
            event.put("role", user.getRole() != null ? user.getRole().name() : "USER");
            event.put("userStreak", user.getUserStreak());
            event.put("userPoints", user.getUserPoints());

            String json = objectMapper.writeValueAsString(event);
            kafkaTemplate.send("user.registered", user.getId().toString(), json);
        } catch (Exception e) {
            System.err.println("Erro ao publicar evento user.registered: " + e.getMessage());
        }
    }
}
