package com.medicore.api.controllers;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestAttribute;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.medicore.api.dto.KitItemRequest;
import com.medicore.api.dto.KitItemResponse;
import com.medicore.api.models.User;
import com.medicore.api.security.AuthTokenInterceptor;
import com.medicore.api.services.KitService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/v1/me/kit")
public class KitController {

    private final KitService kitService;

    public KitController(KitService kitService) {
        this.kitService = kitService;
    }

    @GetMapping
    public List<KitItemResponse> listar(
            @RequestAttribute(AuthTokenInterceptor.USUARIO_ATRIBUTO) User usuario) {

        return kitService.listar(usuario);
    }

    @GetMapping("/{medicineId}")
    public ResponseEntity<KitItemResponse> buscar(
            @RequestAttribute(AuthTokenInterceptor.USUARIO_ATRIBUTO) User usuario,
            @PathVariable Long medicineId) {

        return kitService.buscar(usuario, medicineId)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PutMapping
    public KitItemResponse guardar(
            @RequestAttribute(AuthTokenInterceptor.USUARIO_ATRIBUTO) User usuario,
            @Valid @RequestBody KitItemRequest peticion) {

        return kitService.guardar(usuario, peticion);
    }

    @DeleteMapping("/{medicineId}")
    public ResponseEntity<Void> borrar(
            @RequestAttribute(AuthTokenInterceptor.USUARIO_ATRIBUTO) User usuario,
            @PathVariable Long medicineId) {

        return kitService.borrar(usuario, medicineId)
                ? ResponseEntity.status(HttpStatus.NO_CONTENT).build()
                : ResponseEntity.notFound().build();
    }
}