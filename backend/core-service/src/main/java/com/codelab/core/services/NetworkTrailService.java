package com.codelab.core.services;

import com.codelab.core.dto.NetworkTrailResponse;
import com.codelab.core.dto.NetworkTrailResponse.NetworkTrailItem;
import com.codelab.core.dto.NetworkTrailResponse.NetworkTrailTopic;
import com.codelab.core.entities.AnswerNetwork;
import com.codelab.core.entities.QuestionNetwork;
import com.codelab.core.entities.VerificationStatus;
import com.codelab.core.repositories.AnswerNetworkRepository;
import com.codelab.core.repositories.QuestionNetworkRepository;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Monta a trilha de rede a partir das questões cadastradas.
 *
 * Regras:
 * - cada questão de rede é um "lab" (nó) da trilha;
 * - a questão é COMPLETED quando o aluno já teve um submit NETWORK_APPROVED;
 * - a primeira questão ainda não concluída fica AVAILABLE;
 * - as seguintes ficam LOCKED;
 * - um tópico só fica AVAILABLE se o tópico anterior foi COMPLETED.
 */
@Service
public class NetworkTrailService {

    private final QuestionNetworkRepository questionNetworkRepository;
    private final AnswerNetworkRepository answerNetworkRepository;

    public NetworkTrailService(QuestionNetworkRepository questionNetworkRepository,
                               AnswerNetworkRepository answerNetworkRepository) {
        this.questionNetworkRepository = questionNetworkRepository;
        this.answerNetworkRepository = answerNetworkRepository;
    }

    public NetworkTrailResponse getTrail(Long userId) {
        Set<Long> completedQuestionIds = answerNetworkRepository.findByUserId(userId).stream()
                .filter(this::isApproved)
                .map(answer -> answer.getQuestion().getId())
                .collect(Collectors.toSet());

        Map<QuestionNetwork.QuestionTopicNetwork, List<QuestionNetwork>> questionsByTopic =
                orderedQuestions().stream()
                        .collect(Collectors.groupingBy(
                                QuestionNetwork::getTopic,
                                LinkedHashMap::new,
                                Collectors.toList()));

        List<NetworkTrailTopic> topics = new ArrayList<>();
        boolean previousTopicCompleted = true;

        for (Map.Entry<QuestionNetwork.QuestionTopicNetwork, List<QuestionNetwork>> entry : questionsByTopic.entrySet()) {
            List<QuestionNetwork> questions = entry.getValue();
            int completedQuestions = (int) questions.stream()
                    .filter(question -> completedQuestionIds.contains(question.getId()))
                    .count();
            boolean topicCompleted = completedQuestions >= questions.size();

            String topicStatus = topicCompleted
                    ? "COMPLETED"
                    : (previousTopicCompleted ? "AVAILABLE" : "LOCKED");

            topics.add(new NetworkTrailTopic(
                    entry.getKey().name(),
                    topicStatus,
                    questions.size(),
                    completedQuestions,
                    buildItems(questions, completedQuestionIds, topicStatus)));

            previousTopicCompleted = topicCompleted;
        }

        return new NetworkTrailResponse(topics);
    }

    /**
     * Retorna o status atual de um lab (COMPLETED, AVAILABLE, LOCKED) ou null se ele não existir na trilha.
     */
    public String getQuestionStatus(Long userId, long questionId) {
        return getTrail(userId).topics().stream()
                .flatMap(topic -> topic.questions().stream())
                .filter(item -> item.questionId() != null && item.questionId() == questionId)
                .map(NetworkTrailItem::status)
                .findFirst()
                .orElse(null);
    }

    /**
     * Ordena por tópico (ordem do enum) e depois por id, para a trilha ser sempre a mesma.
     */
    private List<QuestionNetwork> orderedQuestions() {
        return questionNetworkRepository.findAll().stream()
                .sorted(Comparator
                        .comparingInt((QuestionNetwork question) -> question.getTopic().ordinal())
                        .thenComparing(QuestionNetwork::getId))
                .toList();
    }

    private List<NetworkTrailItem> buildItems(List<QuestionNetwork> questions,
                                              Set<Long> completedQuestionIds,
                                              String topicStatus) {
        List<NetworkTrailItem> items = new ArrayList<>();
        boolean availableQuestionFound = false;

        for (QuestionNetwork question : questions) {
            String status;

            if (completedQuestionIds.contains(question.getId())) {
                status = "COMPLETED";
            } else if ("AVAILABLE".equals(topicStatus) && !availableQuestionFound) {
                status = "AVAILABLE";
                availableQuestionFound = true;
            } else {
                status = "LOCKED";
            }

            items.add(new NetworkTrailItem(
                    question.getId(),
                    question.getTitle(),
                    question.getType().name(),
                    question.getDifficulty().name(),
                    status));
        }

        return items;
    }

    private boolean isApproved(AnswerNetwork answer) {
        return answer.getVerificationStatus() == VerificationStatus.NETWORK_APPROVED;
    }
}
