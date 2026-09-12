package com.codelab.verification.dto;

public record AiVerificationResponseDto(
        boolean approved,
        String feedback
) {
}
