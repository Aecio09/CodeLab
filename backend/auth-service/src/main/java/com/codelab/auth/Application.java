package com.codelab.auth;

import com.codelab.auth.services.AdminCreationService;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

@SpringBootApplication
public class Application {

    public static void main(String[] args) {
        SpringApplication.run(Application.class, args);
    }

    @Bean
    public ApplicationRunner seedAdminRunner(AdminCreationService adminCreationService) {
        return new ApplicationRunner() {
            @Override
            public void run(ApplicationArguments args) {
                adminCreationService.createAdminIfNotExists();
                adminCreationService.createUserIfNotExist();
            }
        };
    }
}
