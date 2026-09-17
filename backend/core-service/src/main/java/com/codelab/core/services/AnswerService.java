package com.codelab.core.services;

import com.codelab.core.dto.*;
import com.codelab.core.entities.*;
import com.codelab.core.kafka.AnswerEventProducer;
import com.codelab.core.repositories.*;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class AnswerService {
    private final AnswerRepository answerRepository;
    private final QuestionService questionService;
    private final UserRepository userRepository;
    private final AnswerEventProducer answerEventProducer;

    public AnswerService(AnswerRepository answerRepository,
                         QuestionService questionService,
                         UserRepository userRepository,
                         AnswerEventProducer answerEventProducer) {
        this.answerRepository = answerRepository;
        this.questionService = questionService;
        this.userRepository = userRepository;
        this.answerEventProducer = answerEventProducer;
    }

    /**
     * Cria uma resposta com status PENDING e publica no Kafka (answers.imported).
     * O verification-service consome, verifica e publica em answers.verified.
     * O AnswerVerifiedConsumer do core atualiza o status no DB.
     * Retorna 202 Accepted com a resposta em estado PENDING.
     */
    public Answer createAnswer(AnswerCreateRequest request, java.security.Principal principal) {
        Answer answer = new Answer();
        answer.setAnswerBody(request.answerBody());

        Question question = questionService.getQuestionById(request.questionId());
        answer.setQuestion(question);
        answer.setVerificationStatus(VerificationStatus.PENDING);

        if (principal != null) {
            userRepository.findByEmail(principal.getName()).ifPresent(answer::setUser);
        }

        Answer savedAnswer = answerRepository.save(answer);

        // Publica evento assíncrono para o verification-service
        answerEventProducer.publishAnswerImported(savedAnswer);

        return savedAnswer;
    }

    public Answer updateAnswer(long id, AnswerCreateRequest request, java.security.Principal principal) {
        Answer answer = answerRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Answer not found with id: " + id));

        answer.setAnswerBody(request.answerBody());
        Question question = questionService.getQuestionById(request.questionId());
        answer.setQuestion(question);
        answer.setVerificationStatus(VerificationStatus.PENDING);

        if (principal != null) {
            userRepository.findByEmail(principal.getName()).ifPresent(answer::setUser);
        }

        Answer updatedAnswer = answerRepository.save(answer);

        // Re-publica para reverificação assíncrona
        answerEventProducer.publishAnswerImported(updatedAnswer);

        return updatedAnswer;
    }

    public void deleteAnswer(long id) {
        if (!answerRepository.existsById(id)) {
            throw new RuntimeException("Answer not found with id: " + id);
        }
        answerRepository.deleteById(id);
    }

    public Answer getAnswerById(long id) {
        return answerRepository.findWithDetailsById(id)
                .orElseThrow(() -> new RuntimeException("Answer not found with id: " + id));
    }

    public List<Answer> getAllAnswers() {
        return answerRepository.findAll();
    }

    public List<Answer> getUserAnswersById(long id) {
        return answerRepository.findByUserId(id);
    }

    /**
     * Aplica pontos ao usuário quando a verificação for aprovada (chamado pelo AnswerVerifiedConsumer
     * se quiser mover a lógica de gamificação para cá futuramente).
     * Por ora a gamificação (streak/pontos) é processada após confirmação via answers.verified.
     */
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
        user.setLastActivityDate(LocalDateTime.now());
    }
}
