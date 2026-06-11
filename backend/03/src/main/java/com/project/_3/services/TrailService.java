package com.project._3.services;

import com.project._3.dto.TopicStatusDto;
import com.project._3.entities.Answer;
import com.project._3.entities.Question;
import com.project._3.entities.VerificationStatus;
import com.project._3.repositories.AnswerRepository;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class TrailService {

    private final AnswerRepository answerRepository;

    // Definição da ordem da trilha e quantidade de lições por tópico
    private final LinkedHashMap<Question.Topics, Integer> trailStructure;

    public TrailService(AnswerRepository answerRepository) {
        this.answerRepository = answerRepository;
        
        this.trailStructure = new LinkedHashMap<>();
        this.trailStructure.put(Question.Topics.OPERADORES_TIPOS_E_VARIAVEIS, 5);
        this.trailStructure.put(Question.Topics.EXECUCAO_CONDICIONAL, 7);
        this.trailStructure.put(Question.Topics.OPERADORES_LOGICOS, 5);
        this.trailStructure.put(Question.Topics.LACOS, 10);
        this.trailStructure.put(Question.Topics.SUBPROGRAMAS, 10);
        this.trailStructure.put(Question.Topics.VETORES, 6);
        this.trailStructure.put(Question.Topics.ARRAYS, 8);
        this.trailStructure.put(Question.Topics.TIPOS_CRIADOS_PELO_PROGRAMADOR, 6);
    }

    public List<TopicStatusDto> getStudentProgress(Long userId) {
        // Busca todas as respostas aprovadas do usuário
        List<Answer> approvedAnswers = answerRepository.findByUserId(userId).stream()
                .filter(a -> a.getVerificationStatus() == VerificationStatus.APPROVED)
                .toList();

        // Agrupa por tópico, contando quantas questões ÚNICAS foram aprovadas
        Map<Question.Topics, Long> completedActivitiesByTopic = approvedAnswers.stream()
                .map(a -> a.getQuestion().getTopic())
                .collect(Collectors.groupingBy(topic -> topic, Collectors.counting()));

        List<TopicStatusDto> progressList = new ArrayList<>();
        boolean previousTopicCompleted = true; // O primeiro tópico começa disponível

        for (Map.Entry<Question.Topics, Integer> entry : trailStructure.entrySet()) {
            Question.Topics topic = entry.getKey();
            int totalLessons = entry.getValue();
            int totalRequiredActivities = totalLessons * 2;
            
            long completedActivities = completedActivitiesByTopic.getOrDefault(topic, 0L);
            
            String status;
            if (completedActivities >= totalRequiredActivities) {
                status = "COMPLETED";
            } else if (previousTopicCompleted) {
                status = "AVAILABLE";
            } else {
                status = "LOCKED";
            }

            int currentLesson = (int) (completedActivities / 2) + 1;
            if (currentLesson > totalLessons) currentLesson = totalLessons;
            
            int activitiesInCurrentLesson = (int) (completedActivities % 2);

            progressList.add(new TopicStatusDto(
                topic.name(),
                status,
                currentLesson,
                totalLessons,
                activitiesInCurrentLesson,
                (int) completedActivities
            ));

            // Para o próximo tópico ser disponível, este deve estar COMPLETED
            previousTopicCompleted = "COMPLETED".equals(status);
        }

        return progressList;
    }
}
