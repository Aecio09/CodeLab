package com.codelab.core.repositories;

import com.codelab.core.entities.Answer;

import java.util.*;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AnswerRepository extends JpaRepository<Answer, Long> {
  @EntityGraph(attributePaths = {"question"})
  List<Answer> findByUserId(Long userId);

  @EntityGraph(attributePaths = {"user", "question"})
  Optional<Answer> findWithDetailsById(Long id);

}
