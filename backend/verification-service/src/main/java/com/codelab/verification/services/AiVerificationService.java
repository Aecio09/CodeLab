package com.codelab.verification.services;

import com.codelab.verification.dto.AiVerificationRequestDto;
import com.codelab.verification.dto.AiVerificationResponseDto;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ClassPathResource;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;

@Service
public class AiVerificationService {

    private static final String URL = "https://api.groq.com/openai/v1/chat/completions";
    private final String model;
    private final RestTemplate restTemplate;
    private final String apiKey;

    public AiVerificationService(RestTemplate restTemplate,
                                  @Value("${codelab.groq.model:qwen/qwen3.8-27b}") String model) {
        this.restTemplate = restTemplate;
        this.model = model;
        this.apiKey = loadApiKey();
    }

    public AiVerificationResponseDto verify(AiVerificationRequestDto request) {
        Map<String, Object> payload = Map.of(
                "model", model,
                "max_tokens", 356,
                "messages", List.of(
                        Map.of("role", "system", "content", "Você é um avaliador final de respostas. Analise com rigor, sem inventar requisitos, e decida apenas se a resposta atende ou nao a questao. Se estiver correta, retorne approved=true. Se estiver incorreta, retorne approved=false e use feedback apenas se for realmente necessario para orientar o usuario. Responda somente no formato approved=true;feedback=texto ou approved=false;feedback=texto."),
                        Map.of("role", "user", "content", buildPrompt(request))
                )
        );

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(apiKey);

        Map<?, ?> response = restTemplate.postForObject(URL, new HttpEntity<>(payload, headers), Map.class);
        String content = response == null ? "" : extractContent(response);
        return parse(content);
    }

    private String buildPrompt(AiVerificationRequestDto request) {
        return """
                Fluxo final de avaliacao:
                1. Leia a questao e a resposta.
                2. Verifique se a resposta realmente atende ao enunciado.
                3. Considere o uso obrigatorio, quando existir.
                4. Se a resposta estiver correta, finalize com approved=true.
                5. Se estiver errada, finalize com approved=false e feedback apenas se isso ajudar o usuario.

                Dados da avaliacao:
                Questao: %s
                Resposta: %s
                Tipo: %s
                Dificuldade: %s
                Uso obrigatorio: %s
                Topico: %s
                """
                .formatted(
                        request.questionBody(),
                        request.answerBody(),
                        request.questionType(),
                        request.difficulty(),
                        request.requiredUsage(),
                        request.topic()
                );
    }

    private String extractContent(Map<?, ?> response) {
        List<?> choices = (List<?>) response.get("choices");
        Map<?, ?> firstChoice = (Map<?, ?>) choices.getFirst();
        Map<?, ?> message = (Map<?, ?>) firstChoice.get("message");
        return String.valueOf(message.get("content"));
    }

    private AiVerificationResponseDto parse(String content) {
        String normalized = content.toLowerCase();
        boolean approved = normalized.contains("approved=true");
        String feedback = content.contains("feedback=") ? content.substring(content.indexOf("feedback=") + 9).trim() : null;
        if (feedback != null && feedback.isBlank()) {
            feedback = null;
        }
        return new AiVerificationResponseDto(approved, feedback);
    }

    private String loadApiKey() {
        String envKey = System.getenv("GROQ_API_KEY");
        if (envKey != null && !envKey.isBlank()) {
            return envKey.trim();
        }
        try {
            return new String(new ClassPathResource("APIKEY").getInputStream().readAllBytes(), StandardCharsets.UTF_8).trim();
        } catch (IOException e) {
            return "";
        }
    }
}


