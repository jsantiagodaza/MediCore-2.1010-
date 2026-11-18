package com.medicore.api.dto;

import java.util.List;

public record IngestionResultResponse(
        int fuentes,
        int nuevas,
        int actualizadas,
        int descartadas,
        int fallidas,
        List<SourceStatusResponse> detalle) {
}