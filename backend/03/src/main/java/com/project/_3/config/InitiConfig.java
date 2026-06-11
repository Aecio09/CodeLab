package com.project._3.config;

import com.project._3.services.AdminCreationService;
import com.project._3.services.QuestionSeedStore;
import com.project._3.services.QuestionService;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class InitiConfig {

    @Bean
    public CommandLineRunner initApp(AdminCreationService adminCreationService,
                                     QuestionSeedStore questionSeedStore,
                                     QuestionService questionService) {
        return args -> {
            boolean created = adminCreationService.createAdminIfNotExists();
            boolean created2 = adminCreationService.createUserIfNotExist();
            if (created && created2) {
                System.out.println("Admin e user criado com sucesso!");
            } else {
                System.out.println("Admin ou user já existe, pulando criação.");
            }

            var seedQuestions = questionSeedStore.readSeedQuestions();
            int inserted = questionService.importSeedQuestionsIfMissing(seedQuestions);
            System.out.printf("Seed de questões carregado. Lidas=%d, inseridas=%d%n", seedQuestions.size(), inserted);
        };
    }
}
