package com.project._3.controllers;

import com.project._3.dto.QuestionCreateRequest;
import com.project._3.entities.Question;
import com.project._3.services.QuestionService;
import com.project._3.services.QuestionSeedImportService;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class QuestionControllerTest {

    private final QuestionService questionService = mock(QuestionService.class);
    private final QuestionSeedImportService questionSeedImportService = mock(QuestionSeedImportService.class);
    private final QuestionController questionController = new QuestionController(questionService, questionSeedImportService);

    @Test
    void createQuestionShouldReturnCreatedQuestion() {
        QuestionCreateRequest request = new QuestionCreateRequest(
                "O que faz um loop for?",
                Question.QuestionType.MULTIPLE_CHOICE,
                Question.DifficultyLevel.EASY,
                Question.RequiredUsage.FOR,
                Question.Topics.LACOS
        );

        Question savedQuestion = buildQuestion(1L, request);
        when(questionService.createQuestion(any(QuestionCreateRequest.class))).thenReturn(savedQuestion);

        var response = questionController.createQuestion(request);

        assertEquals(201, response.getStatusCode().value());
        assertSame(savedQuestion, response.getBody());
        verify(questionService).createQuestion(request);
    }

    @Test
    void updateQuestionShouldReturnUpdatedQuestion() {
        QuestionCreateRequest request = new QuestionCreateRequest(
                "O que é uma variável?",
                Question.QuestionType.PRACTICAL,
                Question.DifficultyLevel.MEDIUM,
                Question.RequiredUsage.IF,
                Question.Topics.OPERADORES_TIPOS_E_VARIAVEIS
        );

        Question updatedQuestion = buildQuestion(2L, request);
        when(questionService.updateQuestion(eq(2L), any(QuestionCreateRequest.class))).thenReturn(updatedQuestion);

        var response = questionController.updateQuestion(2L, request);

        assertEquals(200, response.getStatusCode().value());
        assertSame(updatedQuestion, response.getBody());
        verify(questionService).updateQuestion(2L, request);
    }

    @Test
    void getAllQuestionsShouldReturnList() {
        Question question = buildQuestion(3L, new QuestionCreateRequest(
                "Pergunta 1",
                Question.QuestionType.MULTIPLE_CHOICE,
                Question.DifficultyLevel.EASY,
                Question.RequiredUsage.WHILE,
                Question.Topics.LACOS
        ));
        when(questionService.getAllQuestions()).thenReturn(List.of(question));

        var response = questionController.getAllQuestions();

        assertEquals(200, response.getStatusCode().value());
        assertNotNull(response.getBody());
        assertEquals(1, response.getBody().size());
        assertSame(question, response.getBody().getFirst());
    }

    @Test
    void getQuestionByIdShouldReturnQuestion() {
        Question question = buildQuestion(4L, new QuestionCreateRequest(
                "Pergunta 4",
                Question.QuestionType.PRACTICAL,
                Question.DifficultyLevel.HARD,
                Question.RequiredUsage.FOR,
                Question.Topics.EXECUCAO_CONDICIONAL
        ));
        when(questionService.getQuestionById(4L)).thenReturn(question);

        var response = questionController.getQuestionById(4L);

        assertEquals(200, response.getStatusCode().value());
        assertSame(question, response.getBody());
        verify(questionService).getQuestionById(4L);
    }

    @Test
    void deleteQuestionShouldReturnNoContent() {
        doNothing().when(questionService).deleteQuestion(5L);

        var response = questionController.deleteQuestion(5L);

        assertEquals(204, response.getStatusCode().value());
        verify(questionService).deleteQuestion(5L);
    }


    private Question buildQuestion(Long id, QuestionCreateRequest request) {
        Question question = new Question();
        question.setId(id);
        question.setQuestionBody(request.questionBody());
        question.setType(request.type());
        question.setDifficulty(request.difficulty());
        question.setRequiredUsage(request.requiredUsage());
        question.setTopic(request.topic());
        return question;
    }
}
