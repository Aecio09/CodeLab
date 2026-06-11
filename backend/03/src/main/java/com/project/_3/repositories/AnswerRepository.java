package com.project._3.repositories;

import com.project._3.entities.Answer;

import java.util.*;

import org.springframework.data.jpa.repository.JpaRepository;

public interface AnswerRepository extends JpaRepository<Answer, Long> {
  List<Answer> findByUserId(Long userId);

}
