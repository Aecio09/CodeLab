package com.codelab.verification.dto;

public record VerificationResultDto(
        boolean valid,
        String message,
        String requiredUsage,
        boolean found
) {}

