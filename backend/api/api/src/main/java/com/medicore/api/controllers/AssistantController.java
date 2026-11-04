package com.medicore.api.controllers;

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.medicore.api.dto.AssistantMessageRequest;
import com.medicore.api.dto.AssistantMessageResponse;
import com.medicore.api.services.AssistantService;

import jakarta.validation.Valid;

/**
 * Endpoint del asistente.
 *
 * Ruta privada (protegida por AuthTokenInterceptor): el chat requiere sesion.
 * El controlador solo valida la entrada y delega en {@link AssistantService}.
 */
@RestController
@RequestMapping("/api/v1/assistant")
public class AssistantController {

    private final AssistantService assistantService;

    public AssistantController(AssistantService assistantService) {
        this.assistantService = assistantService;
    }

    /**
     * POST /api/v1/assistant/messages
     *
     * Cuerpo:  { "message": "para que sirve el ibuprofeno" }
     * Respuesta estructurada con intent, confianza, sugerencias y fuentes.
     */
    @PostMapping("/messages")
    public AssistantMessageResponse responder(@Valid @RequestBody AssistantMessageRequest request) {
        return assistantService.responder(request.message());
    }
}
