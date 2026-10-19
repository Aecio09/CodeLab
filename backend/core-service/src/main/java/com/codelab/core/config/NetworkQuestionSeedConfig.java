package com.codelab.core.config;

import com.codelab.core.dto.QuestionNetworkCreateRequest;
import com.codelab.core.services.QuestionNetworkService;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.ClassPathResource;

import java.io.InputStream;
import java.util.List;

/**
 * Carrega as questões de rede de "network-questions-seed.json" para o banco
 * quando a aplicação inicia. É idempotente: questões já existentes (mesmo título)
 * são ignoradas.
 */
@Configuration
public class NetworkQuestionSeedConfig {

    private static final Logger log = LoggerFactory.getLogger(NetworkQuestionSeedConfig.class);

    @Bean
    CommandLineRunner initNetworkQuestions(QuestionNetworkService questionNetworkService,
                                           ObjectMapper objectMapper) {
        return args -> {
            ClassPathResource resource = new ClassPathResource("network-questions-seed.json");
            if (!resource.exists()) {
                log.warn("Seed de questões de rede não encontrado: {}", resource.getPath());
                return;
            }

            try (InputStream input = resource.getInputStream()) {
                List<QuestionNetworkCreateRequest> questions = objectMapper.readValue(
                        input, new TypeReference<List<QuestionNetworkCreateRequest>>() {});

                int created = questionNetworkService.seedNetworkQuestions(questions);
                log.info("Seed de questões de rede: {} criada(s) de {} no arquivo", created, questions.size());
            } catch (Exception e) {
                log.error("Falha ao carregar o seed de questões de rede", e);
            }
        };
    }
}
