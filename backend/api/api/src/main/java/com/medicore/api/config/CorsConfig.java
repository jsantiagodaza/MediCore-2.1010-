package com.medicore.api.config;

import java.util.Arrays;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * CORS del API.
 *
 * Solo se permiten los origenes configurados en {@code cors.allowed-origins}
 * (por defecto el frontend de Vite en desarrollo: http://localhost:5173).
 * Para produccion se define la variable de entorno CORS_ALLOWED_ORIGINS.
 *
 * No se usa "*": con comodin cualquier sitio podria llamar al API desde el
 * navegador de un usuario.
 */
@Configuration
public class CorsConfig implements WebMvcConfigurer {

    private final String[] origenesPermitidos;

    public CorsConfig(@Value("${cors.allowed-origins}") String origenes) {
        this.origenesPermitidos = Arrays.stream(origenes.split(","))
                .map(String::trim)
                .filter(origen -> !origen.isEmpty())
                .toArray(String[]::new);
    }

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
                .allowedOrigins(origenesPermitidos)
                .allowedMethods("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS")
                .allowedHeaders("Authorization", "Content-Type", "Accept")
                .exposedHeaders("Location")
                .maxAge(3600);
    }
}
