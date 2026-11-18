package com.medicore.api.assistant;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.RestClient;

import com.fasterxml.jackson.databind.ObjectMapper;

@Configuration
public class AssistantProviderConfiguration {

    @Bean
    @ConditionalOnProperty(prefix = "app.assistant", name = "provider", havingValue = "http")
    public AssistantProvider httpAssistantProvider(
            ObjectMapper json,
            @Value("${app.assistant.endpoint}") String endpoint,
            @Value("${app.assistant.api-key:}") String apiKey,
            @Value("${app.assistant.model:gpt-4o-mini}") String modelo,
            @Value("${app.assistant.max-tokens:300}") int maxTokens,
            @Value("${app.assistant.timeout-ms:8000}") int timeoutMs) {

        SimpleClientHttpRequestFactory fabrica = new SimpleClientHttpRequestFactory();
        fabrica.setConnectTimeout(timeoutMs);
        fabrica.setReadTimeout(timeoutMs);

        RestClient cliente = RestClient.builder()
                .requestFactory(fabrica)
                .build();

        return new HttpAssistantProvider(cliente, json, endpoint, apiKey, modelo, maxTokens);
    }
}
