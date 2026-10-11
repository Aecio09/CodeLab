package com.codelab.core.repositories;

import com.codelab.core.entities.AnswerNetwork;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface AnswerNetworkRepository extends JpaRepository<AnswerNetwork, Long> {

    @EntityGraph(attributePaths = {"user", "question"})
    List<AnswerNetwork> findByUserId(Long userId);

    @EntityGraph(attributePaths = {"user", "question"})
    Optional<AnswerNetwork> findWithDetailsById(Long id);

    @Query("select a from AnswerNetwork a")
    @EntityGraph(attributePaths = {"user", "question"})
    List<AnswerNetwork> findAllWithDetails();
}