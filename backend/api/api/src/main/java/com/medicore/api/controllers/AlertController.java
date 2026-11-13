package com.medicore.api.controllers;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.medicore.api.dto.AlertFilterOptionsResponse;
import com.medicore.api.models.SeasonAlert;
import com.medicore.api.services.AlertService;

@RestController
@RequestMapping("/api/v1/alerts")
public class AlertController {

    private final AlertService alertService;

    public AlertController(AlertService alertService) {
        this.alertService = alertService;
    }

    @GetMapping
    public List<SeasonAlert> listar(
            @RequestParam(value = "city", required = false) String city,
            @RequestParam(value = "region", required = false) String region,
            @RequestParam(value = "category", required = false) String category,
            @RequestParam(value = "riskLevel", required = false) String riskLevel,
            @RequestParam(value = "active", required = false) Boolean active) {

        return alertService.search(city, region, category, riskLevel, active);
    }

    @GetMapping("/filters")
    public AlertFilterOptionsResponse filtros() {
        return alertService.getFilterOptions();
    }

    @GetMapping("/{id}")
    public ResponseEntity<SeasonAlert> detalle(@PathVariable Long id) {
        return alertService.getById(id)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }
}