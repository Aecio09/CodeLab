package com.codelab.core.repositories;

import com.codelab.core.entities.Question;
import com.codelab.core.entities.VerificationStatus;
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
                                         @Param("topic") Question.Topics topic, 
                                         @Param("difficulty") Question.DifficultyLevel difficulty,
                                         @Param("status") VerificationStatus status,
                                         org.springframework.data.domain.Pageable pageable);

    default java.util.Optional<Question> findNextQuestionForUser(Long userId, Question.Topics topic, Question.DifficultyLevel difficulty) {
        List<Question> results = findNextQuestionsJPQL(userId, topic, difficulty, VerificationStatus.APPROVED, org.springframework.data.domain.PageRequest.of(0, 1));
        return results.isEmpty() ? java.util.Optional.empty() : java.util.Optional.of(results.get(0));
    }
}
