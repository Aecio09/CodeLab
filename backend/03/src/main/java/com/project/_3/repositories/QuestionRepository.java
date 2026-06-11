package com.project._3.repositories;

import com.project._3.entities.Question;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.Optional;
import java.util.List;

public interface QuestionRepository extends JpaRepository<Question, Long> {
    boolean existsByQuestionBody(String questionBody);

    @Query("SELECT q FROM Question q " +
           "WHERE q.topic = :topic AND q.difficulty = :difficulty " +
           "AND q.id NOT IN (SELECT a.question.id FROM Answer a WHERE a.user.id = :userId AND a.verificationStatus = :status) " +
           "ORDER BY function('RAND')")
    List<Question> findNextQuestionsJPQL(@Param("userId") Long userId, 
                                         @Param("topic") com.project._3.entities.Question.Topics topic, 
                                         @Param("difficulty") com.project._3.entities.Question.DifficultyLevel difficulty,
                                         @Param("status") com.project._3.entities.VerificationStatus status,
                                         org.springframework.data.domain.Pageable pageable);

    default java.util.Optional<Question> findNextQuestionForUser(Long userId, com.project._3.entities.Question.Topics topic, com.project._3.entities.Question.DifficultyLevel difficulty) {
        List<Question> results = findNextQuestionsJPQL(userId, topic, difficulty, com.project._3.entities.VerificationStatus.APPROVED, org.springframework.data.domain.PageRequest.of(0, 1));
        return results.isEmpty() ? java.util.Optional.empty() : java.util.Optional.of(results.get(0));
    }
}
