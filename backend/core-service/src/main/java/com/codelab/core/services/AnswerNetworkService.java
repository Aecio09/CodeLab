package com.codelab.core.services;

import com.codelab.core.dto.AnswerNetworkCreateRequest;
import com.codelab.core.dto.AnswerNetworkView;
import com.codelab.core.entities.AnswerNetwork;
import com.codelab.core.entities.QuestionNetwork;
import com.codelab.core.entities.VerificationStatus;
import com.codelab.core.repositories.AnswerNetworkRepository;
import com.codelab.core.repositories.UserRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;

import java.security.Principal;
import java.util.List;

@Service
public class AnswerNetworkService {

    private final AnswerNetworkRepository answerNetworkRepository;
    private final QuestionNetworkService questionNetworkService;
    private final UserRepository userRepository;
    private final ObjectMapper objectMapper;

    public AnswerNetworkService(AnswerNetworkRepository answerNetworkRepository,
                                QuestionNetworkService questionNetworkService,
                                UserRepository userRepository,
                                ObjectMapper objectMapper) {
        this.answerNetworkRepository = answerNetworkRepository;
        this.questionNetworkService = questionNetworkService;
        this.userRepository = userRepository;
        this.objectMapper = objectMapper;
    }

    public AnswerNetworkView createAnswerNetwork(AnswerNetworkCreateRequest request, Principal principal) {
        AnswerNetwork answer = new AnswerNetwork();
        applyAnswerNetwork(answer, request, principal);
        answer.setVerificationStatus(VerificationStatus.PENDING);
        return AnswerNetworkView.from(answerNetworkRepository.save(answer), objectMapper);
    }

    public AnswerNetworkView updateAnswerNetwork(long id, AnswerNetworkCreateRequest request, Principal principal) {
        AnswerNetwork answer = answerNetworkRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("AnswerNetwork not found with id: " + id));
        applyAnswerNetwork(answer, request, principal);
        answer.setVerificationStatus(VerificationStatus.PENDING);
        return AnswerNetworkView.from(answerNetworkRepository.save(answer), objectMapper);
    }

    public void deleteAnswerNetwork(long id) {
        if (!answerNetworkRepository.existsById(id)) {
            throw new RuntimeException("AnswerNetwork not found with id: " + id);
        }
        answerNetworkRepository.deleteById(id);
    }

    public AnswerNetworkView getAnswerNetworkById(long id) {
        return AnswerNetworkView.from(answerNetworkRepository.findWithDetailsById(id)
                .orElseThrow(() -> new RuntimeException("AnswerNetwork not found with id: " + id)), objectMapper);
    }

    public List<AnswerNetworkView> getAllAnswerNetworks() {
        return answerNetworkRepository.findAllWithDetails().stream()
                .map(answer -> AnswerNetworkView.from(answer, objectMapper))
                .toList();
    }

    public List<AnswerNetworkView> getUserAnswerNetworksById(long id) {
        return answerNetworkRepository.findByUserId(id).stream()
                .map(answer -> AnswerNetworkView.from(answer, objectMapper))
                .toList();
    }

    private void applyAnswerNetwork(AnswerNetwork answer, AnswerNetworkCreateRequest request, Principal principal) {
        answer.setAnswer(request.answer().toString());
        QuestionNetwork question = questionNetworkService.getQuestionNetworkById(request.questionId());
        answer.setQuestion(question);
        if (principal != null) {
            userRepository.findByEmail(principal.getName()).ifPresent(answer::setUser);
        }
    }
}