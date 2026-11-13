package com.medicore.api.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import com.medicore.api.security.AuthTokenInterceptor;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    private static final String[] RUTAS_PUBLICAS = {
            "/api/v1/health",
            "/api/v1/health/**",
            "/api/v1/auth/login",
            "/api/v1/auth/register",
            "/api/v1/medicines",
            "/api/v1/medicines/**",
            "/api/v1/alerts",
            "/api/v1/alerts/**"
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