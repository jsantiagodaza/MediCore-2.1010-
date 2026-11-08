package com.medicore.api.dto;

import java.time.LocalDateTime;

import com.medicore.api.models.User;

/** Resultado interno de un login correcto. */
public record AuthResult(User user, String token, LocalDateTime expiresAt) {
}
