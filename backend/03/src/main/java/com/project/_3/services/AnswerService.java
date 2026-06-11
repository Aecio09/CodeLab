package com.project._3.services;


import com.project._3.dto.AnswerCreateRequest;
import com.project._3.dto.AnswerVerificationRequestDto;
import com.project._3.dto.AiVerificationRequestDto;
import com.project._3.dto.AiVerificationResponseDto;
import com.project._3.dto.VerificationResultDto;
import com.project._3.entities.Answer;
import com.project._3.entities.Question;
import com.project._3.entities.VerificationStatus;
import com.project._3.exceptions.AnswerRejectedByAiException;
import com.project._3.exceptions.AnswerRejectedByNodeException;
import com.project._3.repositories.AnswerRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class AnswerService {
    private final AnswerRepository answerRepository;
    private final QuestionService questionService;
    private final CodeVerificationService codeVerificationService;
    private final AiVerificationService aiVerificationService;
    private final com.project._3.repositories.UserRepository userRepository;

    public AnswerService(AnswerRepository answerRepository,
                         QuestionService questionService,
                         CodeVerificationService codeVerificationService,
                         AiVerificationService aiVerificationService,
                         com.project._3.repositories.UserRepository userRepository) {
        this.answerRepository = answerRepository;
        this.questionService = questionService;
        this.codeVerificationService = codeVerificationService;
        this.aiVerificationService = aiVerificationService;
        this.userRepository = userRepository;
    }

    public Answer createAnswer(AnswerCreateRequest request, java.security.Principal principal) {
        Answer answer = new Answer();
        answer.setAnswerBody(request.answerBody());
        Question question = questionService.getQuestionById(request.questionId());
        answer.setQuestion(question);
        
        if (principal != null) {
            userRepository.findByEmail(principal.getName()).ifPresent(answer::setUser);
        }

        Answer savedAnswer = answerRepository.save(answer);
        
        // Verifica resposta no serviço de verificação de código
        verifyAnswer(savedAnswer, question);
        
        return savedAnswer;
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
        AnswerVerificationRequestDto verificationRequest = new AnswerVerificationRequestDto(
                answer.getId(),
                question.getId(),
                answer.getAnswerBody(),
                question.getQuestionBody(),
                question.getType().name(),
                question.getDifficulty().name(),
                question.getRequiredUsage() != null ? question.getRequiredUsage().name() : null,
                question.getTopic().name()
        );
        
        try {
            VerificationResultDto result = codeVerificationService.verifyAnswer(verificationRequest);
            
            // Passou na barreira do Node, então segue para avaliacao da IA.
            answer.setVerificationStatus(VerificationStatus.NODE_VERIFIED);
            answer.setNodeVerificationResult(result.message());
            answerRepository.save(answer);
            verifyWithAi(answer, question);
            
        } catch (AnswerRejectedByNodeException e) {
            // Se rejeitado, atualiza status e relança a exceção
            answer.setVerificationStatus(VerificationStatus.NODE_REJECTED);
            answer.setNodeVerificationResult(e.getNodeMessage());
            answerRepository.save(answer);
            throw e;
        }
    }

    private void verifyWithAi(Answer answer, Question question) {
        AiVerificationRequestDto aiRequest = new AiVerificationRequestDto(
                answer.getId(),
                question.getId(),
                answer.getAnswerBody(),
                question.getQuestionBody(),
                question.getType().name(),
                question.getDifficulty().name(),
                question.getRequiredUsage() != null ? question.getRequiredUsage().name() : null,
                question.getTopic().name()
        );

        AiVerificationResponseDto aiResult = aiVerificationService.verify(aiRequest);
        if (aiResult.approved()) {
            answer.setVerificationStatus(VerificationStatus.APPROVED);
            answer.setAiVerificationResult(aiResult.feedback() == null ? "Approved by AI" : aiResult.feedback());
            answerRepository.save(answer);
            return;
        }

        answer.setVerificationStatus(VerificationStatus.AI_REJECTED);
        answer.setAiVerificationResult(aiResult.feedback() == null ? "Answer rejected by AI" : aiResult.feedback());
        answerRepository.save(answer);
        throw new AnswerRejectedByAiException(answer.getAiVerificationResult());
    }
}
