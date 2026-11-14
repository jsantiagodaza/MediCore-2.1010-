package com.medicore.api.dto;

import java.time.LocalDateTime;

import com.medicore.api.models.KitItem;

public record KitItemResponse(
        Long id,
        Long medicineId,
        String name,
        String category,
        int quantity,
        String notes,
        LocalDateTime updatedAt) {

    public static KitItemResponse from(KitItem item) {
        return new KitItemResponse(
                item.getId(),
                item.getMedicine().getId(),
                item.getMedicine().getName(),
                item.getMedicine().getCategory(),
                item.getQuantity(),
                item.getNotes(),
                item.getUpdatedAt());
    }
}