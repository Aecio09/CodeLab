package com.codelab.core.services;

import com.codelab.core.dto.*;
import com.codelab.core.entities.*;
import com.codelab.core.exceptions.*;
import com.codelab.core.repositories.*;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class AnswerService {
    private final AnswerRepository answerRepository;
    private final QuestionService questionService;
    private final UserRepository userRepository;

    public AnswerService(AnswerRepository answerRepository,
                         QuestionService questionService,
                         UserRepository userRepository) {
        this.answerRepository = answerRepository;
        this.questionService = questionService;
        this.userRepository = userRepository;
    }

    public Answer createAnswer(AnswerCreateRequest request, java.security.Principal principal) {
        Answer answer = new Answer();
        answer.setAnswerBody(request.answerBody());
        Question question = questionService.getQuestionById(request.questionId());
        answer.setQuestion(question);
        
        User user = null;
        if (principal != null) {
            user = userRepository.findByEmail(principal.getName()).orElse(null);
            answer.setUser(user);
        }

        Answer savedAnswer = answerRepository.save(answer);
        
        try {
            verifyAnswer(savedAnswer, question);
            if (user != null) {
                applyPoints(user, question, true);
                updateStreak(user);
                userRepository.save(user);
            }
        } catch (Exception e) {
            if (user != null) {
                applyPoints(user, question, false);
                userRepository.save(user);
            }
            throw e;
        }
        
        return savedAnswer;
    }

    private void applyPoints(User user, Question question, boolean success) {
        float basePoints = switch (question.getDifficulty()) {
            case EASY -> 500f;
            case MEDIUM -> 1000f;
            case HARD -> 2000f;
        };
        
        float change = success ? basePoints : -(basePoints / 2f);
        user.setUserPoints(Math.max(0, user.getUserPoints() + change));
    }

    private void updateStreak(User user) {
        java.time.LocalDate today = java.time.LocalDate.now();
        if (user.getLastActivityDate() == null) {
            user.setUserStreak(1);
        } else {
            java.time.LocalDate last = user.getLastActivityDate().toLocalDate();
            if (today.isEqual(last.plusDays(1))) {
                user.setUserStreak(user.getUserStreak() + 1);
            } else if (today.isAfter(last.plusDays(1))) {
                user.setUserStreak(1);
            }
        }
        user.setLastActivityDate(java.time.LocalDateTime.now());
    }

    public Answer updateAnswer(long id, AnswerCreateRequest request, java.security.Principal principal) {
        Answer answer = answerRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Answer not found with id: " + id));

        answer.setAnswerBody(request.answerBody());
        Question question = questionService.getQuestionById(request.questionId());
        answer.setQuestion(question);

        if (principal != null) {
            userRepository.findByEmail(principal.getName()).ifPresent(answer::setUser);
        }

        Answer updatedAnswer = answerRepository.save(answer);
        
        // Verifica resposta no serviço de verificação de código
        verifyAnswer(updatedAnswer, question);
        
        return updatedAnswer;
    }

    public void deleteAnswer(long id) {
        if (!answerRepository.existsById(id)) {
            throw new RuntimeException("Answer not found with id: " + id);
        }
        answerRepository.deleteById(id);
    }

    public Answer getAnswerById(long id) {
        return answerRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Answer not found with id: " + id));
    }

    public List<Answer> getAllAnswers() {
        return answerRepository.findAll();
    }
    public List<Answer> getUserAnswersById(long id){
    return answerRepository.findByUserId(id);
  }
    private void verifyAnswer(Answer answer, Question question) {
        answer.setVerificationStatus(VerificationStatus.PENDING);
        answerRepository.save(answer);
    }
}
