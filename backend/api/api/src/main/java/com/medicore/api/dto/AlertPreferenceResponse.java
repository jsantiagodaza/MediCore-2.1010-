package com.medicore.api.dto;

import java.time.LocalDateTime;

import com.medicore.api.models.AlertPreference;

public record AlertPreferenceResponse(
        Long id,
        String city,
        String region,
        String category,
        String riskLevel,
        boolean enabled,
        LocalDateTime updatedAt) {

    public static AlertPreferenceResponse from(AlertPreference preferencia) {
        return new AlertPreferenceResponse(
                preferencia.getId(),
                preferencia.getCity(),
                preferencia.getRegion(),
                preferencia.getCategory(),
                preferencia.getRiskLevel().name(),
                preferencia.isEnabled(),
                preferencia.getUpdatedAt());
    }
}