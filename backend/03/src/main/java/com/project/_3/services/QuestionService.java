package com.project._3.services;


import com.project._3.entities.Question;
import com.project._3.dto.QuestionCreateRequest;
import com.project._3.repositories.QuestionRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class QuestionService {

    private final QuestionRepository questionRepository;

    public QuestionService(QuestionRepository questionRepository) {
        this.questionRepository = questionRepository;
    }

    public Question createQuestion(QuestionCreateRequest request) {
        Question question = new Question();
        question.setQuestionBody(request.questionBody());
        question.setType(request.type());
        question.setDifficulty(request.difficulty());
        question.setRequiredUsage(request.requiredUsage());
        question.setTopic(request.topic());
        question.setStarterCode(request.starterCode());
        return questionRepository.save(question);
    }

    public Question updateQuestion(long id, QuestionCreateRequest request) {
        Question question = questionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Question not found with id: " + id));

        question.setQuestionBody(request.questionBody());
        question.setType(request.type());
        question.setDifficulty(request.difficulty());
        question.setRequiredUsage(request.requiredUsage());
        question.setTopic(request.topic());
        question.setStarterCode(request.starterCode());
        return questionRepository.save(question);
    }

    public void deleteQuestion(long id) {
        if (!questionRepository.existsById(id)) {
            throw new RuntimeException("Question not found with id: " + id);
        }
        questionRepository.deleteById(id);
    }

    public Question getQuestionById(long id) {
        return questionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Question not found with id: " + id));
    }

    public List<Question> getAllQuestions() {
        return questionRepository.findAll();
    }

    public Question.DifficultyLevel determineDifficulty(int currentLesson, int totalLessons) {
        float progress = (float) currentLesson / totalLessons;
        if (progress <= 0.35f) return Question.DifficultyLevel.EASY;
        if (progress <= 0.75f) return Question.DifficultyLevel.MEDIUM;
        return Question.DifficultyLevel.HARD;
    }

    public java.util.Optional<Question> findNextQuestionForUser(Long userId, Question.Topics topic, Question.DifficultyLevel difficulty) {
        return questionRepository.findNextQuestionForUser(userId, topic, difficulty);
    }

    public int importSeedQuestionsIfMissing(List<QuestionCreateRequest> seedQuestions) {
        int inserted = 0;
        for (QuestionCreateRequest request : seedQuestions) {
            if (questionRepository.existsByQuestionBody(request.questionBody())) {
                continue;
            }
            createQuestion(request);
            inserted++;
        }
        return inserted;
    }
}
