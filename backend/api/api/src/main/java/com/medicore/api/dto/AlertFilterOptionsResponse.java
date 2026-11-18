package com.medicore.api.dto;

import java.util.List;

public record AlertFilterOptionsResponse(
        List<String> categories,
        List<String> riskLevels,
        List<String> regions,
        List<String> cities) {
}