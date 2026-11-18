package com.medicore.api.dto;

import java.time.LocalDateTime;

import com.medicore.api.models.AlertSourceRun;
import com.medicore.api.sources.AlertSource;

public record SourceStatusResponse(
        String sourceId,
        String nombre,
        String status,
        int alertsImported,
        String errorMessage,
        LocalDateTime startedAt,
        LocalDateTime finishedAt) {

    public static SourceStatusResponse desde(AlertSource fuente, AlertSourceRun corrida) {
        return new SourceStatusResponse(
                fuente.id(),
                fuente.nombre(),
                corrida.getStatus().name(),
                corrida.getAlertsImported(),
                corrida.getErrorMessage(),
                corrida.getStartedAt(),
                corrida.getFinishedAt());
    }

    public static SourceStatusResponse sinCorridas(AlertSource fuente) {
        return new SourceStatusResponse(fuente.id(), fuente.nombre(), "SIN_CORRIDAS", 0, null, null, null);
    }
}