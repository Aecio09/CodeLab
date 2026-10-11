package com.codelab.core.repositories;

import com.codelab.core.entities.QuestionNetwork;
import org.springframework.data.jpa.repository.JpaRepository;

public interface QuestionNetworkRepository extends JpaRepository<QuestionNetwork, Long> {
}
