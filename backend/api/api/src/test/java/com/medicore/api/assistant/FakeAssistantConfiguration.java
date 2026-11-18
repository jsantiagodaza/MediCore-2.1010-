package com.medicore.api.assistant;

import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;

@TestConfiguration
public class FakeAssistantConfiguration {

    @Bean
    public FakeAssistantProvider fakeAssistantProvider() {
        return new FakeAssistantProvider();
    }
}