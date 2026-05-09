package com.project._3.config;

import com.project._3.services.AdminCreationService;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class InitiConfig {

    @Bean
    public CommandLineRunner initAdmin(AdminCreationService adminCreationService) {
        return args -> {
            boolean created = adminCreationService.createAdminIfNotExists();
            if (created) {
                System.out.println("Admin criado com sucesso!");
            } else {
                System.out.println("Admin já existe, pulando criação.");
            }
        };
    }
}
