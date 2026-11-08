package com.medicore.api.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import com.medicore.api.security.AuthTokenInterceptor;

/**
 * Politica de acceso del API.
 *
 * Por defecto TODO /api/** es privado (requiere Authorization: Bearer <token>).
 * Solo se abren las rutas explicitamente publicas:
 *
 *   GET  /api/v1/health          estado del servicio
 *   GET  /api/v1/health/db       estado de la base de datos
 *   POST /api/v1/auth/login      iniciar sesion
 *   POST /api/v1/auth/register   crear cuenta
 *   GET  /api/v1/medicines/**    catalogo publico de medicamentos
 *
 * Cualquier endpoint nuevo queda protegido automaticamente.
 */
@Configuration
public class WebConfig implements WebMvcConfigurer {

    private static final String[] RUTAS_PUBLICAS = {
            "/api/v1/health",
            "/api/v1/health/**",
            "/api/v1/auth/login",
            "/api/v1/auth/register",
            "/api/v1/medicines",
            "/api/v1/medicines/**"
    };

    private final AuthTokenInterceptor authTokenInterceptor;

    public WebConfig(AuthTokenInterceptor authTokenInterceptor) {
        this.authTokenInterceptor = authTokenInterceptor;
    }

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(authTokenInterceptor)
                .addPathPatterns("/api/**")
                .excludePathPatterns(RUTAS_PUBLICAS);
    }
}
