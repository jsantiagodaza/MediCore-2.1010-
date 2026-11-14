package com.medicore.api.sources;

import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;

@TestConfiguration
public class FakeSourcesConfiguration {

    @Bean
    public FakeAlertSource fakeAlertSource() {
        return new FakeAlertSource();
    }
}