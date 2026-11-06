package com.medicore.api.controllers;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.medicore.api.dto.AuthResponse;
import com.medicore.api.dto.AuthResult;
import com.medicore.api.dto.LoginRequest;
import com.medicore.api.dto.RegisterRequest;
import com.medicore.api.dto.UserResponse;
import com.medicore.api.services.AuthService;

import jakarta.validation.Valid;

/**
 * Endpoints de autenticacion. Toda la logica (hash, validaciones, sesiones)
 * esta en {@link AuthService}.
 */
@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    private static final String PREFIJO_BEARER = "Bearer ";

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    /** POST /api/v1/auth/register */
    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public UserResponse register(@Valid @RequestBody RegisterRequest request) {
        return UserResponse.from(
                authService.register(request.email(), request.password(), request.name()));
    }

    /** POST /api/v1/auth/login */
    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest request) {
        AuthResult resultado = authService.login(request.email(), request.password());
        return new AuthResponse(
                resultado.token(),
                resultado.expiresAt(),
                UserResponse.from(resultado.user()));
    }

    /** POST /api/v1/auth/logout (Authorization: Bearer <token>) */
    @PostMapping("/logout")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void logout(@RequestHeader(value = "Authorization", required = false) String authorization) {
        authService.logout(tokenDe(authorization));
    }

    /** GET /api/v1/auth/me (Authorization: Bearer <token>) */
    @GetMapping("/me")
    public UserResponse me(@RequestHeader(value = "Authorization", required = false) String authorization) {
        return UserResponse.from(authService.authenticate(tokenDe(authorization)));
    }

    private String tokenDe(String authorization) {
        if (authorization == null || !authorization.startsWith(PREFIJO_BEARER)) {
            return "";
        }
        return authorization.substring(PREFIJO_BEARER.length());
    }
}
