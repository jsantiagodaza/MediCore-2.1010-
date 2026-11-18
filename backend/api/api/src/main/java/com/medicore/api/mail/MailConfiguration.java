package com.medicore.api.mail;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.mail.javamail.JavaMailSender;

@Configuration
public class MailConfiguration {

    @Bean
    @ConditionalOnProperty(prefix = "app.mail", name = "provider", havingValue = "smtp", matchIfMissing = true)
    public EmailSender smtpEmailSender(JavaMailSender mailSender,
                                       @Value("${app.mail.from}") String remitente,
                                       @Value("${app.mail.from-name:MediCore}") String nombreRemitente) {
        return new SmtpEmailSender(mailSender, remitente, nombreRemitente);
    }
}