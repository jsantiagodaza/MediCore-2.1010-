package com.medicore.api.sources;

import java.time.LocalDate;

import com.medicore.api.models.RiskLevel;

public record ExternalAlert(
        String externalId,
        String title,
        String description,
        String category,
        RiskLevel riskLevel,
        String city,
        String region,
        String source,
        LocalDate startsOn,
        LocalDate endsOn) {

    public boolean esValida() {
        return externalId != null && !externalId.isBlank()
                && title != null && !title.isBlank()
                && startsOn != null;
    }
}