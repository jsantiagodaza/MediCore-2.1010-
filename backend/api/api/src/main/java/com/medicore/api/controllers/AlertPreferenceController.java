package com.medicore.api.controllers;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestAttribute;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.medicore.api.dto.AlertPreferenceRequest;
import com.medicore.api.dto.AlertPreferenceResponse;
import com.medicore.api.models.User;
import com.medicore.api.security.AuthTokenInterceptor;
import com.medicore.api.services.AlertPreferenceService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/v1/me/alert-preferences")
public class AlertPreferenceController {

    private final AlertPreferenceService preferenceService;

    public AlertPreferenceController(AlertPreferenceService preferenceService) {
        this.preferenceService = preferenceService;
    }

    @GetMapping
    public ResponseEntity<AlertPreferenceResponse> consultar(
            @RequestAttribute(AuthTokenInterceptor.USUARIO_ATRIBUTO) User usuario) {

        return preferenceService.get(usuario)
                .map(AlertPreferenceResponse::from)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PutMapping
    public AlertPreferenceResponse guardar(
            @RequestAttribute(AuthTokenInterceptor.USUARIO_ATRIBUTO) User usuario,
            @Valid @RequestBody AlertPreferenceRequest peticion) {

        return AlertPreferenceResponse.from(preferenceService.save(usuario, peticion));
    }

    @DeleteMapping
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void borrar(
            @RequestAttribute(AuthTokenInterceptor.USUARIO_ATRIBUTO) User usuario) {

        preferenceService.delete(usuario);
    }
}