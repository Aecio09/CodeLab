package com.project._3.services;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.project._3.dto.QuestionCreateRequest;
import com.project._3.entities.Question;
import org.springframework.core.io.ClassPathResource;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.text.Normalizer;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.HashMap;

@Service
public class AiQuestionExtractor {

    private static final String URL = "https://api.groq.com/openai/v1/chat/completions";
    private static final String MODEL = "llama-3.1-8b-instant";

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final String apiKey;

    public AiQuestionExtractor(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
        this.apiKey = loadApiKey();
    }

    public List<QuestionCreateRequest> extractQuestions(String text) {
        String rawJson = askAi(text);
        return parseQuestions(rawJson);
    }

    private String askAi(String text) {
        Map<String, Object> payload = Map.of(
                "model", MODEL,
                "messages", List.of(
                        Map.of("role", "system", "content", """
                                Você é um extrator de questões técnico e RIGOROSO. 
                                Você deve retornar APENAS um objeto JSON no formato especificado abaixo.
                                
                                ESTRUTURA OBRIGATÓRIA:
                                {"questions":[{"questionBody":"...","type":"...","difficulty":"...","requiredUsage":"...","topic":"...","starterCode":"..."}]}

                                REGRAS INVIOLÁVEIS:
                                1. O campo "type" DEVE ser EXCLUSIVAMENTE "PRACTICAL" ou "MULTIPLE_CHOICE". 
                                   NUNCA use termos descritivos como "Array 1D", "Exercício", "Algoritmo" ou "Lógica" neste campo.
                                2. O campo "topic" DEVE ser EXATAMENTE um destes 8 valores:
                                   OPERADORES_TIPOS_E_VARIAVEIS, EXECUCAO_CONDICIONAL, OPERADORES_LOGICOS, LACOS, SUBPROGRAMAS, VETORES, ARRAYS, TIPOS_CRIADOS_PELO_PROGRAMADOR.
                                3. O campo "difficulty" DEVE ser "EASY", "MEDIUM" ou "HARD".
                                4. Se houver código para o aluno completar ou corrigir, esse código DEVE ir para "starterCode".
                                5. Retorne APENAS o JSON. Sem markdown, sem preâmbulos e sem explicações.
                                """),
                        Map.of("role", "user", "content", "Extraia as questões seguindo rigorosamente as REGRAS INVIOLÁVEIS. Texto:\n" + text)
                )
        );

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(apiKey);

        Map<?, ?> response = restTemplate.postForObject(URL, new HttpEntity<>(payload, headers), Map.class);
        if (response == null) {
            throw new IllegalStateException("Resposta vazia da IA");
        }

        List<?> choices = (List<?>) response.get("choices");
        if (choices == null || choices.isEmpty()) {
            throw new IllegalStateException("Resposta da IA sem choices");
        }

        Map<?, ?> firstChoice = (Map<?, ?>) choices.getFirst();
        Map<?, ?> message = (Map<?, ?>) firstChoice.get("message");
        return String.valueOf(message.get("content"));
    }

    private List<QuestionCreateRequest> parseQuestions(String rawJson) {
        try {
            String cleaned = cleanJson(rawJson);
            JsonNode root = objectMapper.readTree(cleaned);
            JsonNode questionsNode = root.isArray() ? root : root.path("questions");

            if (!questionsNode.isArray() || questionsNode.isEmpty()) {
                throw new IllegalStateException("JSON da IA sem perguntas");
            }

            List<QuestionCreateRequest> questions = new ArrayList<>();
            for (JsonNode node : questionsNode) {
                questions.add(new QuestionCreateRequest(
                        requiredText(node, "questionBody"),
                        parseQuestionType(node),
                        parseDifficulty(node),
                        parseOptionalRequiredUsage(node),
                        parseTopic(node),
                        node.path("starterCode").asText(null)
                ));
            }
            return questions;
        } catch (IOException e) {
            throw new IllegalStateException("JSON inválido retornado pela IA", e);
        }
    }

    private String cleanJson(String rawJson) {
        String cleaned = rawJson == null ? "" : rawJson.trim();
        if (cleaned.startsWith("```json")) {
            cleaned = cleaned.substring(7).trim();
        } else if (cleaned.startsWith("```")) {
            cleaned = cleaned.substring(3).trim();
        }
        if (cleaned.endsWith("```")) {
            cleaned = cleaned.substring(0, cleaned.length() - 3).trim();
        }

        int startObject = cleaned.indexOf('{');
        int startArray = cleaned.indexOf('[');
        int start = startObject < 0 ? startArray : (startArray < 0 ? startObject : Math.min(startObject, startArray));

        int endObject = cleaned.lastIndexOf('}');
        int endArray = cleaned.lastIndexOf(']');
        int end = Math.max(endObject, endArray);

        if (start < 0 || end < 0 || end <= start) {
            throw new IllegalStateException("Resposta da IA não contém JSON válido");
        }
        return cleaned.substring(start, end + 1).trim();
    }

    private String requiredText(JsonNode node, String field) {
        String value = node.path(field).asText(null);
        if (value == null || value.isBlank()) {
            throw new IllegalStateException("Campo obrigatório ausente no JSON da IA: " + field);
        }
        return value;
    }

    private Question.QuestionType parseQuestionType(JsonNode node) {
        String value = requiredText(node, "type");
        Map<String, String> aliases = new HashMap<>();
        aliases.put("MULTIPLA_ESCOLHA", "MULTIPLE_CHOICE");
        aliases.put("MULTIPLA ESCOLHA", "MULTIPLE_CHOICE");
        aliases.put("MULTIPLE CHOICE", "MULTIPLE_CHOICE");
        aliases.put("TEORICA", "MULTIPLE_CHOICE");
        aliases.put("TEORICO", "MULTIPLE_CHOICE");
        aliases.put("PRATICA", "PRACTICAL");
        aliases.put("PRACTICA", "PRACTICAL");
        aliases.put("EXERCICIO", "PRACTICAL");
        aliases.put("DESAFIO", "PRACTICAL");
        aliases.put("CODIGO", "PRACTICAL");
        
        return parseRequiredEnum(value, "type", Question.QuestionType.class, aliases);
    }

    private Question.DifficultyLevel parseDifficulty(JsonNode node) {
        String value = requiredText(node, "difficulty");
        Map<String, String> aliases = new HashMap<>();
        aliases.put("FACIL", "EASY");
        aliases.put("SIMPLE", "EASY");
        aliases.put("MEDIO", "MEDIUM");
        aliases.put("MEDIA", "MEDIUM");
        aliases.put("INTERMEDIARIO", "MEDIUM");
        aliases.put("DIFICIL", "HARD");
        aliases.put("AVANCADO", "HARD");
        aliases.put("COMPLEXO", "HARD");
        
        return parseRequiredEnum(value, "difficulty", Question.DifficultyLevel.class, aliases);
    }

    private Question.Topics parseTopic(JsonNode node) {
        String value = requiredText(node, "topic");
        Map<String, String> aliases = new HashMap<>();
        aliases.put("OPERADORES TIPOS E VARIAVEIS", "OPERADORES_TIPOS_E_VARIAVEIS");
        aliases.put("OPERADORES TIPOS VARIAVEIS", "OPERADORES_TIPOS_E_VARIAVEIS");
        aliases.put("OPERADORES_LOGICOS", "OPERADORES_LOGICOS");
        aliases.put("LOGICA", "OPERADORES_LOGICOS");
        aliases.put("EXECUCAO CONDICIONAL", "EXECUCAO_CONDICIONAL");
        aliases.put("CONDICIONAIS", "EXECUCAO_CONDICIONAL");
        aliases.put("LACOS_DE_REPETICAO", "LACOS");
        aliases.put("LOOPS", "LACOS");
        aliases.put("REPETICAO", "LACOS");
        aliases.put("FUNCOES", "SUBPROGRAMAS");
        aliases.put("MATRIZES", "ARRAYS");
        aliases.put("TIPOS_CRIADOS_PELO_PROGRAMADOR", "TIPOS_CRIADOS_PELO_PROGRAMADOR");
        aliases.put("TIPOS CRIADOS PELO PROGRAMADOR", "TIPOS_CRIADOS_PELO_PROGRAMADOR");
        aliases.put("STRUCTS", "TIPOS_CRIADOS_PELO_PROGRAMADOR");

        return parseRequiredEnum(value, "topic", Question.Topics.class, aliases);
    }

    private Question.RequiredUsage parseOptionalRequiredUsage(JsonNode node) {
        String value = node.path("requiredUsage").asText(null);
        if (value == null || value.isBlank() || "null".equalsIgnoreCase(value)) {
            return null;
        }
        try {
            return parseRequiredEnum(value, "requiredUsage", Question.RequiredUsage.class, Map.of());
        } catch (IllegalStateException e) {
            return null;
        }
    }

    private <E extends Enum<E>> E parseRequiredEnum(String rawValue, String field, Class<E> enumClass, Map<String, String> aliases) {
        String normalized = normalizeEnumValue(rawValue);

        E exact = tryParseEnum(resolveAlias(normalized, aliases), enumClass);
        if (exact != null) {
            return exact;
        }

        for (String part : normalized.split("[|/,;]")) {
            String token = resolveAlias(normalizeEnumValue(part), aliases);
            E candidate = tryParseEnum(token, enumClass);
            if (candidate != null) {
                return candidate;
            }
        }

        for (E enumValue : enumClass.getEnumConstants()) {
            if (normalized.contains(enumValue.name())) {
                return enumValue;
            }
        }

        throw new IllegalStateException("Valor inválido para campo " + field + ": " + rawValue);
    }

    private <E extends Enum<E>> E tryParseEnum(String value, Class<E> enumClass) {
        if (value == null || value.isBlank()) {
            return null;
        }
        try {
            return Enum.valueOf(enumClass, value);
        } catch (IllegalArgumentException e) {
            return null;
        }
    }

    private String resolveAlias(String value, Map<String, String> aliases) {
        return aliases.getOrDefault(value, value);
    }

    private String normalizeEnumValue(String value) {
        if (value == null) {
            return "";
        }
        String withoutAccents = Normalizer.normalize(value, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "");
        return withoutAccents
                .trim()
                .toUpperCase()
                .replace('-', '_')
                .replace(' ', '_');
    }

    private String loadApiKey() {
        try {
            return new String(new ClassPathResource("APIKEY").getInputStream().readAllBytes(), StandardCharsets.UTF_8).trim();
        } catch (IOException e) {
            throw new IllegalStateException("API key not found in resources/APIKEY", e);
        }
    }
}
