package com.project._3.dto;

public record QuestionSeedImportResponse(
        String sourceFile,
        int extractedQuestions,
        int insertedQuestions,
        int seedQuestionsTotal
) {
}

