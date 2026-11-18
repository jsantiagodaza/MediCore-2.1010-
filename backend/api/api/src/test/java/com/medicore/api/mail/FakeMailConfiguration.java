package com.medicore.api.mail;

import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;

@TestConfiguration
public class FakeMailConfiguration {

    @Bean
    public FakeEmailSender fakeEmailSender() {
        return new FakeEmailSender();
    }
}