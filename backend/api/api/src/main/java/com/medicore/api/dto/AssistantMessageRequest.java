package com.medicore.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Pregunta enviada al asistente.
 *
 * La validacion se hace con Bean Validation: si el mensaje viene vacio o
 * demasiado largo, ApiExceptionHandler responde 400 con JSON uniforme.
 */
public record AssistantMessageRequest(
        @NotBlank(message = "El mensaje no puede estar vacio")
        @Size(max = 500, message = "El mensaje no puede superar 500 caracteres")
        String message) {
}
