package com.medicore.api.dto;

import java.time.LocalDateTime;

/** Sesion emitida: el token solo se muestra aqui, una unica vez. */
public record AuthResponse(String token, LocalDateTime expiresAt, UserResponse user) {
}
