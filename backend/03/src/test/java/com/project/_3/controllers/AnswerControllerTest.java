package com.project._3.controllers;

import com.project._3.dto.AnswerCreateRequest;
import com.project._3.entities.Answer;
import com.project._3.services.AnswerService;
import com.project._3.repositories.UserRepository;
import org.junit.jupiter.api.Test;

import java.security.Principal;
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

class AnswerControllerTest {

    private final AnswerService answerService = mock(AnswerService.class);
    private final UserRepository userRepository = mock(UserRepository.class);
    private final AnswerController answerController = new AnswerController(answerService, userRepository);
    private final Principal principal = mock(Principal.class);

    @Test
    void createAnswerShouldReturnCreatedAnswer() {
        AnswerCreateRequest request = new AnswerCreateRequest("Minha resposta", 1L);
        Answer createdAnswer = new Answer();
        createdAnswer.setId(10L);
        createdAnswer.setAnswerBody(request.answerBody());

        when(answerService.createAnswer(any(AnswerCreateRequest.class), any(Principal.class))).thenReturn(createdAnswer);

        var response = answerController.createAnswer(request, principal);

        assertEquals(201, response.getStatusCode().value());
        assertSame(createdAnswer, response.getBody());
        verify(answerService).createAnswer(request, principal);
    }

    @Test
    void updateAnswerShouldReturnUpdatedAnswer() {
        AnswerCreateRequest request = new AnswerCreateRequest("Resposta atualizada", 2L);
        Answer updatedAnswer = new Answer();
        updatedAnswer.setId(11L);
        updatedAnswer.setAnswerBody(request.answerBody());

        when(answerService.updateAnswer(eq(11L), any(AnswerCreateRequest.class), any(Principal.class))).thenReturn(updatedAnswer);

        var response = answerController.updateAnswer(11L, request, principal);

        assertEquals(200, response.getStatusCode().value());
        assertSame(updatedAnswer, response.getBody());
        verify(answerService).updateAnswer(11L, request, principal);
    }

    @Test
    void getAnswerByIdShouldReturnAnswer() {
        Answer answer = new Answer();
        answer.setId(12L);
        answer.setAnswerBody("Resposta 12");

        // Mocking user for security check in controller might be needed if using @PreAuthorize in tests
        // But for unit tests with mocked service, we usually mock the service response.
        when(answerService.getAnswerById(12L)).thenReturn(answer);

        var response = answerController.getAnswerById(12L);

        assertEquals(200, response.getStatusCode().value());
        assertSame(answer, response.getBody());
        verify(answerService).getAnswerById(12L);
    }

    @Test
    void getAllAnswersShouldReturnList() {
        Answer answer = new Answer();
        answer.setId(13L);
        answer.setAnswerBody("Resposta 13");

        when(answerService.getAllAnswers()).thenReturn(List.of(answer));

        var response = answerController.getAllAnswers();

        assertEquals(200, response.getStatusCode().value());
        assertNotNull(response.getBody());
        assertEquals(1, response.getBody().size());
        assertSame(answer, response.getBody().getFirst());
        verify(answerService).getAllAnswers();
    }

    @Test
    void deleteAnswerShouldReturnNoContent() {
        doNothing().when(answerService).deleteAnswer(14L);

        var response = answerController.deleteAnswer(14L);

        assertEquals(204, response.getStatusCode().value());
        verify(answerService).deleteAnswer(14L);
    }
}
