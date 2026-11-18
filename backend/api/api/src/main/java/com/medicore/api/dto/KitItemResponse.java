package com.medicore.api.dto;

import java.time.LocalDateTime;
import java.util.List;

import com.medicore.api.models.KitItem;

public record KitItemResponse(
        Long id,
        Long medicineId,
        String name,
        String category,
        String dose,
        String uses,
        String emoji,
        int quantity,
        String notes,
        List<String> precautions,
        LocalDateTime updatedAt) {

    public static KitItemResponse from(KitItem item) {
        return new KitItemResponse(
                item.getId(),
                item.getMedicine().getId(),
                item.getMedicine().getName(),
                item.getMedicine().getCategory(),
                item.getMedicine().getDose(),
                item.getMedicine().getUses(),
                item.getMedicine().getEmoji(),
                item.getQuantity(),
                item.getNotes(),
                item.getMedicine().getPrecautions(),
                item.getUpdatedAt());
    }
}