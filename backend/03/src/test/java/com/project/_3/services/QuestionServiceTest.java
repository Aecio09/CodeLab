package com.project._3.services;

import com.project._3.dto.QuestionCreateRequest;
import com.project._3.entities.Question;
import com.project._3.repositories.QuestionRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class QuestionServiceTest {

    @Mock
    private QuestionRepository questionRepository;

    @InjectMocks
    private QuestionService questionService;

    @Test
    void createQuestionShouldMapRequestAndSaveQuestion() {
        QuestionCreateRequest request = new QuestionCreateRequest(
                "O que faz um loop for?",
                Question.QuestionType.MULTIPLE_CHOICE,
                Question.DifficultyLevel.EASY,
                Question.RequiredUsage.FOR,
                Question.Topics.LACOS,
                "console.log('starter')"
        );

        Question savedQuestion = new Question();
        savedQuestion.setId(1L);
        when(questionRepository.save(org.mockito.ArgumentMatchers.any(Question.class))).thenReturn(savedQuestion);

        Question result = questionService.createQuestion(request);

        ArgumentCaptor<Question> questionCaptor = ArgumentCaptor.forClass(Question.class);
        verify(questionRepository, times(1)).save(questionCaptor.capture());

        Question questionToSave = questionCaptor.getValue();
        assertEquals("O que faz um loop for?", questionToSave.getQuestionBody());
        assertEquals(Question.QuestionType.MULTIPLE_CHOICE, questionToSave.getType());
        assertEquals(Question.DifficultyLevel.EASY, questionToSave.getDifficulty());
        assertEquals(Question.RequiredUsage.FOR, questionToSave.getRequiredUsage());
        assertEquals(Question.Topics.LACOS, questionToSave.getTopic());
        assertEquals("console.log('starter')", questionToSave.getStarterCode());

        assertSame(savedQuestion, result);
        assertEquals(1L, result.getId());
    }
}
