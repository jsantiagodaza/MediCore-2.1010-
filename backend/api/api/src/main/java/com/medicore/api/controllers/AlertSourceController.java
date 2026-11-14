package com.medicore.api.controllers;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.medicore.api.dto.IngestionResultResponse;
import com.medicore.api.dto.SourceStatusResponse;
import com.medicore.api.services.AlertIngestionService;

@RestController
@RequestMapping("/api/v1/alert-sources")
public class AlertSourceController {

    private final AlertIngestionService ingestionService;

    public AlertSourceController(AlertIngestionService ingestionService) {
        this.ingestionService = ingestionService;
    }

    @GetMapping
    public List<SourceStatusResponse> estado() {
        return ingestionService.estado();
    }

    @PostMapping("/refresh")
    public IngestionResultResponse sincronizar() {
        return ingestionService.sincronizar();
    }
}