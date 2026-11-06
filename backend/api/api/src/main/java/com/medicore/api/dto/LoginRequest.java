package com.medicore.api.dto;

import jakarta.validation.constraints.NotBlank;

/** Datos para iniciar sesion. */
public record LoginRequest(
        @NotBlank(message = "El email es obligatorio")
        String email,

        @NotBlank(message = "La contrasena es obligatoria")
        String password) {
}
