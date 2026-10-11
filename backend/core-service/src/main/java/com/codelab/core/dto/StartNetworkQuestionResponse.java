package com.codelab.core.dto;

import com.fasterxml.jackson.databind.JsonNode;

public record StartNetworkQuestionResponse(String sessionId, JsonNode scenario) {
}