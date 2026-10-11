package com.codelab.core.clients;

import com.codelab.core.exceptions.SessionNotFoundException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.util.List;
import java.util.Map;

@Component
public class NetworkEngineClient {

    private final RestClient restClient;
    private final ObjectMapper objectMapper;

    public NetworkEngineClient(RestClient networkEngineRestClient, ObjectMapper objectMapper) {
        this.restClient = networkEngineRestClient;
        this.objectMapper = objectMapper;
    }

    public StartSessionResult startSession(String scenarioJson, String authHeader) {
        try {
            JsonNode snapshot = objectMapper.readTree(scenarioJson);
            SessionStartResponse response = restClient.post()
                    .uri("/api/sessions/from-snapshot")
                    .header("Authorization", authHeader)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(Map.of("snapshot", snapshot))
                    .retrieve()
                    .body(SessionStartResponse.class);
            return new StartSessionResult(response.sessionId(), snapshot);
        } catch (Exception e) {
            throw new RuntimeException("falha ao abrir sessao no network-engine", e);
        }
    }

    public record StartSessionResult(String sessionId, JsonNode scenario) {}

    public record SessionStartResponse(String sessionId, String exerciseId) {}

    public VerifySessionResponse verifySession(String sessionId, String checksJson, String authHeader) {
        try {
            JsonNode checks = objectMapper.readTree(checksJson);
            return restClient.post()
                    .uri("/api/sessions/{sessionId}/verify", sessionId)
                    .header("Authorization", authHeader)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(Map.of("checks", checks))
                    .retrieve()
                    .onStatus(this::isNotFound, (request, response) -> {
                        throw new SessionNotFoundException("sessao nao encontrada no network-engine: " + sessionId);
                    })
                    .body(VerifySessionResponse.class);
        } catch (SessionNotFoundException e) {
            throw e;
        } catch (Exception e) {
            throw new RuntimeException("falha ao verificar resposta no network-engine", e);
        }
    }

    public record VerifySessionResponse(String verdict, List<VerifyCheckResult> checks) {}

    public record VerifyCheckResult(String field, String check, JsonNode expected, JsonNode actual, boolean passed) {}

    private boolean isNotFound(HttpStatusCode status) {
        return status.isSameCodeAs(HttpStatusCode.valueOf(404));
    }
}