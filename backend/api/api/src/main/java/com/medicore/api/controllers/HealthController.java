package com.medicore.api.controllers;

import java.util.Map;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/health")
public class HealthController {

    @GetMapping
    public Map<String, String> checkHealth() {
        // Retorna un JSON simple: {"status": "UP"}
        return Map.of("status", "UP", "message", "API de MediCore en linea");
    }
}
