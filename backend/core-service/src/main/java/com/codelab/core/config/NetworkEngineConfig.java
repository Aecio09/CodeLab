package com.codelab.core.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestClient;

@Configuration
public class NetworkEngineConfig {

    @Bean
    public RestClient networkEngineRestClient(@Value("${codelab.network-engine.url:http://network-engine:8084}") String baseUrl) {
        return RestClient.builder().baseUrl(baseUrl).build();
    }
}