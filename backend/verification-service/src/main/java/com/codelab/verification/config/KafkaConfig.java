package com.codelab.verification.config;

import org.apache.kafka.clients.admin.NewTopic;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.config.TopicBuilder;

@Configuration
public class KafkaConfig {

    @Bean
    public NewTopic answersImportedTopic() {
        return TopicBuilder.name("answers.imported")
                .partitions(1)
                .replicas(1)
                .build();
    }

    @Bean
    public NewTopic answersVerifiedTopic() {
        return TopicBuilder.name("answers.verified")
                .partitions(1)
                .replicas(1)
                .build();
    }
}
