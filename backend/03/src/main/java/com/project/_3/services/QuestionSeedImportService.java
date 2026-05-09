package com.project._3.services;

import com.project._3.dto.QuestionCreateRequest;
import com.project._3.dto.QuestionSeedImportResponse;
import com.project._3.entities.Question;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.apache.poi.xwpf.extractor.XWPFWordExtractor;
import org.apache.poi.xwpf.usermodel.XWPFDocument;
import org.springframework.core.io.ClassPathResource;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class QuestionSeedImportService {

    private static final String URL = "https://api.groq.com/openai/v1/chat/completions";
    private static final String MODEL = "llama-3.1-8b-instant";
    private static final String RESOURCE_FOLDER = "questionsSeedAndETL";
    private static final Path SEED_PATH = Path.of("uploads/questionsSeedAndETL/questions-seed.json");

    private final RestTemplate restTemplate;
    private final QuestionService questionService;
    private final JdbcTemplate jdbcTemplate;
    private final com.fasterxml.jackson.databind.ObjectMapper objectMapper = new com.fasterxml.jackson.databind.ObjectMapper();
    private final String apiKey;

    public QuestionSeedImportService(RestTemplate restTemplate,
                                     QuestionService questionService,
                                     JdbcTemplate jdbcTemplate) {
        this.restTemplate = restTemplate;
        this.questionService = questionService;
        this.jdbcTemplate = jdbcTemplate;
        this.apiKey = loadApiKey();
    }

    public QuestionSeedImportResponse importFromResource(String fileName) {
        String resourcePath = RESOURCE_FOLDER + "/" + fileName;
        ClassPathResource sourceFile = new ClassPathResource(resourcePath);
        if (!sourceFile.exists()) {
            throw new IllegalArgumentException("Arquivo não encontrado em questionsSeedAndETL: " + fileName);
        }

        String text = extractText(sourceFile, fileName);
        String aiJson = askAi(text);
        List<QuestionCreateRequest> newQuestions = parseQuestions(aiJson);

        List<QuestionCreateRequest> merged = mergeWithCurrentSeed(newQuestions);
        String seedJson = writeSeed(merged);
        saveSeedInDatabase(fileName, seedJson);

        for (QuestionCreateRequest question : newQuestions) {
            questionService.createQuestion(question);
        }

        return new QuestionSeedImportResponse(fileName, newQuestions.size(), newQuestions.size(), merged.size());
    }

    private String extractText(ClassPathResource sourceFile, String fileName) {
        try {
            String name = fileName.toLowerCase();
            if (name.endsWith(".docx")) {
                try (var in = sourceFile.getInputStream();
                     var doc = new XWPFDocument(in);
                     var extractor = new XWPFWordExtractor(doc)) {
                    return extractor.getText();
                }
            }
            if (name.endsWith(".pdf")) {
                byte[] bytes = sourceFile.getInputStream().readAllBytes();
                try (PDDocument document = Loader.loadPDF(bytes)) {
                    return new PDFTextStripper().getText(document);
                }
            }
            throw new IllegalArgumentException("Formato inválido. Use .docx ou .pdf");
        } catch (IOException e) {
            throw new IllegalStateException("Erro ao ler arquivo: " + fileName, e);
        }
    }

    private String askAi(String text) {
        Map<String, Object> payload = Map.of(
                "model", MODEL,
                "messages", List.of(
                        Map.of("role", "system", "content", """
                                Você deve retornar SOMENTE JSON válido, sem markdown, sem texto extra e sem blocos de código.
                                Use exatamente este schema:
                                {
                                  "questions": [
                                    {
                                      "questionBody": "texto da questão",
                                      "type": "MULTIPLE_CHOICE|PRACTICAL",
                                      "difficulty": "EASY|MEDIUM|HARD",
                                      "requiredUsage": "nome do enum ou null",
                                      "topic": "OPERADORES_TIPOS_E_VARIAVEIS|EXECUCAO_CONDICIONAL|OPERADORES_LOGICOS|LACOS|SUBPROGRAMAS|VETORES|ARRAYS|TIPOS_CRIADOS_PELO_PROGRAMADOR"
                                    }
                                  ]
                                }
                                Regras:
                                - type deve ser um dos valores exatos do enum.
                                - difficulty deve ser um dos valores exatos do enum.
                                - topic deve ser um dos valores exatos do enum.
                                - requiredUsage deve ser um dos valores exatos do enum ou null.
                                - Não traduza os valores.
                                - Não use "EXERCÍCIO", "FÁCIL", "MÉDIA" ou qualquer termo em português nos campos de enum.
                                """),
                        Map.of("role", "user", "content", """
                                Extraia as questões do texto abaixo e devolva apenas o JSON no schema solicitado.
                                Texto:
                                %s
                                """.formatted(text))
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
        Map<?, ?> firstChoice = (Map<?, ?>) choices.getFirst();
        Map<?, ?> message = (Map<?, ?>) firstChoice.get("message");
        return String.valueOf(message.get("content"));
    }

    private List<QuestionCreateRequest> parseQuestions(String rawJson) {
        try {
            String cleaned = cleanJson(rawJson);
            var root = objectMapper.readTree(cleaned);
            var questionsNode = root.isArray() ? root : root.path("questions");
            if (!questionsNode.isArray() || questionsNode.isEmpty()) {
                throw new IllegalStateException("JSON da IA sem perguntas");
            }

            List<QuestionCreateRequest> questions = new ArrayList<>();
            for (var node : questionsNode) {
                questions.add(new QuestionCreateRequest(
                        requiredText(node, "questionBody"),
                        Question.QuestionType.valueOf(requiredText(node, "type").toUpperCase()),
                        Question.DifficultyLevel.valueOf(requiredText(node, "difficulty").toUpperCase()),
                        parseOptionalRequiredUsage(node),
                        Question.Topics.valueOf(requiredText(node, "topic").toUpperCase())
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

        int objectStart = cleaned.indexOf('{');
        int arrayStart = cleaned.indexOf('[');
        int start;
        if (objectStart == -1) {
            start = arrayStart;
        } else if (arrayStart == -1) {
            start = objectStart;
        } else {
            start = Math.min(objectStart, arrayStart);
        }

        int objectEnd = cleaned.lastIndexOf('}');
        int arrayEnd = cleaned.lastIndexOf(']');
        int end = Math.max(objectEnd, arrayEnd);

        if (start < 0 || end < 0 || end <= start) {
            throw new IllegalStateException("Resposta da IA não contém JSON válido");
        }

        return cleaned.substring(start, end + 1).trim();
    }

    private String requiredText(com.fasterxml.jackson.databind.JsonNode node, String field) {
        String value = node.path(field).asText(null);
        if (value == null || value.isBlank()) {
            throw new IllegalStateException("Campo obrigatório ausente no JSON da IA: " + field);
        }
        return value;
    }

    private Question.RequiredUsage parseOptionalRequiredUsage(com.fasterxml.jackson.databind.JsonNode node) {
        String value = node.path("requiredUsage").asText(null);
        if (value == null || value.isBlank() || "null".equalsIgnoreCase(value)) {
            return null;
        }
        return Question.RequiredUsage.valueOf(value.toUpperCase());
    }

    private List<QuestionCreateRequest> mergeWithCurrentSeed(List<QuestionCreateRequest> incoming) {
        List<QuestionCreateRequest> current = new ArrayList<>();
        if (Files.exists(SEED_PATH)) {
            try {
                QuestionWrapper wrapper = objectMapper.readValue(Files.readString(SEED_PATH), QuestionWrapper.class);
                if (wrapper != null && wrapper.questions() != null) {
                    current.addAll(wrapper.questions());
                }
            } catch (IOException e) {
                throw new IllegalStateException("Erro ao ler questions-seed.json", e);
            }
        }

        Map<String, QuestionCreateRequest> merged = new LinkedHashMap<>();
        for (QuestionCreateRequest q : current) {
            merged.put(q.questionBody(), q);
        }
        for (QuestionCreateRequest q : incoming) {
            merged.put(q.questionBody(), q);
        }
        return new ArrayList<>(merged.values());
    }

    private String writeSeed(List<QuestionCreateRequest> merged) {
        try {
            Files.createDirectories(SEED_PATH.getParent());
            String json = objectMapper.writerWithDefaultPrettyPrinter()
                    .writeValueAsString(new QuestionWrapper(merged));
            Files.writeString(SEED_PATH, json, StandardCharsets.UTF_8);
            return json;
        } catch (IOException e) {
            throw new IllegalStateException("Erro ao atualizar questions-seed.json", e);
        }
    }

    private void saveSeedInDatabase(String sourceFile, String payloadJson) {
        jdbcTemplate.execute("""
                CREATE TABLE IF NOT EXISTS question_seed_json (
                    id BIGINT AUTO_INCREMENT PRIMARY KEY,
                    source_file VARCHAR(255) NOT NULL,
                    payload_json LONGTEXT NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
                """);
        jdbcTemplate.update("INSERT INTO question_seed_json(source_file, payload_json) VALUES (?, ?)", sourceFile, payloadJson);
    }

    private String loadApiKey() {
        try {
            return new String(new ClassPathResource("APIKEY").getInputStream().readAllBytes(), StandardCharsets.UTF_8).trim();
        } catch (IOException e) {
            throw new IllegalStateException("API key not found in resources/APIKEY", e);
        }
    }

    private record QuestionWrapper(List<QuestionCreateRequest> questions) {
    }
}
