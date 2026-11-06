package com.medicore.api.dto;

import java.time.LocalDateTime;

import com.medicore.api.models.UserSession;

/**
 * Sesion activa de un usuario.
 *
 * @param current true si es la sesion desde la que se esta consultando
 */
public record SessionResponse(
        Long id,
        LocalDateTime createdAt,
        LocalDateTime expiresAt,
        boolean current) {

    public static SessionResponse from(UserSession sesion, String tokenHashActual) {
        return new SessionResponse(
                sesion.getId(),
                sesion.getCreatedAt(),
                sesion.getExpiresAt(),
                sesion.getTokenHash().equals(tokenHashActual));
    }
}
