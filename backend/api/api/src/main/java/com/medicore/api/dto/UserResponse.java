package com.medicore.api.dto;

import com.medicore.api.models.User;

/** Datos publicos del usuario: nunca incluye el hash de la contrasena. */
public record UserResponse(Long id, String email, String name) {

    public static UserResponse from(User user) {
        return new UserResponse(user.getId(), user.getEmail(), user.getName());
    }
}
