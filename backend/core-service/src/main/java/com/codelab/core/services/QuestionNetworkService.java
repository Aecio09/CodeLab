package com.codelab.core.services;

import com.codelab.core.clients.NetworkEngineClient;
import com.codelab.core.dto.QuestionNetworkCreateRequest;
import com.codelab.core.dto.StartNetworkQuestionResponse;
import com.codelab.core.dto.SubmitNetworkQuestionResponse;
import com.codelab.core.entities.AnswerNetwork;
import com.codelab.core.entities.QuestionNetwork;
import com.codelab.core.entities.VerificationStatus;
import com.codelab.core.repositories.AnswerNetworkRepository;
import com.codelab.core.repositories.QuestionNetworkRepository;
import com.codelab.core.repositories.UserRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.core.JsonProcessingException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.security.Principal;
import java.util.List;

@Service
public class QuestionNetworkService {

    private final QuestionNetworkRepository questionNetworkRepository;
    private final NetworkEngineClient networkEngineClient;
    private final AnswerNetworkRepository answerNetworkRepository;
    private final UserRepository userRepository;
    private final NetworkTrailService networkTrailService;
    private final ObjectMapper objectMapper;

    public QuestionNetworkService(QuestionNetworkRepository questionNetworkRepository,
                                  NetworkEngineClient networkEngineClient,
                                  AnswerNetworkRepository answerNetworkRepository,
                                  UserRepository userRepository,
                                  NetworkTrailService networkTrailService,
                                  ObjectMapper objectMapper) {
        this.questionNetworkRepository = questionNetworkRepository;
        this.networkEngineClient = networkEngineClient;
        this.answerNetworkRepository = answerNetworkRepository;
        this.userRepository = userRepository;
        this.networkTrailService = networkTrailService;
        this.objectMapper = objectMapper;
    }

    public QuestionNetwork createQuestionNetwork(QuestionNetworkCreateRequest request) {
        QuestionNetwork question = new QuestionNetwork();
        applyQuestionNetwork(question, request);
        return questionNetworkRepository.save(question);
    }

    /**
     * Insere as questões do seed que ainda não existem (comparação pelo título).
     * Retorna quantas foram criadas.
     */
    public int seedNetworkQuestions(List<QuestionNetworkCreateRequest> questions) {
        int created = 0;
        for (QuestionNetworkCreateRequest request : questions) {
            if (questionNetworkRepository.existsByTitle(request.title())) {
                continue;
            }
            createQuestionNetwork(request);
            created++;
        }
        return created;
    }

    public QuestionNetwork updateQuestionNetwork(long id, QuestionNetworkCreateRequest request) {
        QuestionNetwork question = questionNetworkRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("QuestionNetwork not found with id: " + id));
        applyQuestionNetwork(question, request);
        return questionNetworkRepository.save(question);
    }

    public void deleteQuestionNetwork(long id) {
        if (!questionNetworkRepository.existsById(id)) {
            throw new RuntimeException("QuestionNetwork not found with id: " + id);
        }
        questionNetworkRepository.deleteById(id);
    }

    public QuestionNetwork getQuestionNetworkById(long id) {
        return questionNetworkRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("QuestionNetwork not found with id: " + id));
    }

    public List<QuestionNetwork> getAllQuestionNetworks() {
        return questionNetworkRepository.findAll();
    }

    public StartNetworkQuestionResponse startQuestionNetwork(long id, String authHeader, Principal principal) {
        QuestionNetwork question = getQuestionNetworkById(id);

        // O bloqueio da trilha também é validado no servidor, não só na UI.
        if (principal != null) {
            userRepository.findByEmail(principal.getName()).ifPresent(user -> {
                boolean isAdmin = "ADMIN".equalsIgnoreCase(user.getRole());
                if (!isAdmin && "LOCKED".equals(networkTrailService.getQuestionStatus(user.getId(), id))) {
                    throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                            "lab bloqueado: conclua o lab anterior");
                }
            });
        }

        NetworkEngineClient.StartSessionResult result = networkEngineClient.startSession(question.getScenery(), authHeader);
        return new StartNetworkQuestionResponse(result.sessionId(), result.scenario());
    }

    public SubmitNetworkQuestionResponse submitQuestionNetwork(long id, String sessionId, String authHeader,
                                                               Principal principal) {
        QuestionNetwork question = getQuestionNetworkById(id);
        if (question.getSceneryAnswers() == null || question.getSceneryAnswers().isBlank()) {
            throw new IllegalArgumentException("questao de rede sem gabarito (sceneryAnswers)");
        }

        NetworkEngineClient.VerifySessionResponse verify =
                networkEngineClient.verifySession(sessionId, question.getSceneryAnswers(), authHeader);

        AnswerNetwork answer = new AnswerNetwork();
        answer.setQuestion(question);
        answer.setAnswer(toJson(verify));
        answer.setVerificationStatus("APPROVED".equals(verify.verdict())
                ? VerificationStatus.NETWORK_APPROVED
                : VerificationStatus.NETWORK_REJECTED);
        if (principal != null) {
            userRepository.findByEmail(principal.getName()).ifPresent(answer::setUser);
        }
        answerNetworkRepository.save(answer);

        return new SubmitNetworkQuestionResponse(answer.getId(), answer.getVerificationStatus(),
                objectMapper.valueToTree(verify));
    }

    private String toJson(Object value) {
        try {
            return objectMapper.writeValueAsString(value);
        } catch (JsonProcessingException e) {
            throw new RuntimeException("falha ao serializar resultado da verificacao", e);
        }
    }

    private void applyQuestionNetwork(QuestionNetwork question, QuestionNetworkCreateRequest request) {
        question.setTitle(request.title());
        question.setScenery(request.scenery().toString());
        question.setSceneryAnswers(request.sceneryAnswers().toString());
        question.setType(request.type());
        question.setTopic(request.topic());
        question.setDifficulty(request.difficulty());
    }
}