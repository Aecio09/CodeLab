package com.codelab.core.dto;

public record VerificationResultDto(boolean valid, String message, String requiredUsage, boolean requirementsMet) {}
