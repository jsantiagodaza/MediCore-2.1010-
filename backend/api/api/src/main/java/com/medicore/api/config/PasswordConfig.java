package com.medicore.api.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

/**
 * Encoder de contrasenas.
 *
 * BCrypt incorpora un salt aleatorio por contrasena y es lento a proposito,
 * lo que dificulta los ataques por fuerza bruta. Se usa la libreria
 * spring-security-crypto (solo el encoder, sin proteger los endpoints).
 */
@Configuration
public class PasswordConfig {

    /** Fuerza 10: ~100 ms por hash, suficiente para el proyecto. */
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(10);
    }
}
