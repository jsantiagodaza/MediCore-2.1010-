package com.medicore.api.dto;

import java.time.LocalDateTime;

import com.medicore.api.models.NotificationDelivery;

public record NotificationDeliveryResponse(
        Long id,
        Long alertId,
        String alertTitle,
        String recipient,
        String status,
        int attempts,
        String errorMessage,
        LocalDateTime sentAt,
        LocalDateTime createdAt) {

    public static NotificationDeliveryResponse from(NotificationDelivery envio) {
        return new NotificationDeliveryResponse(
                envio.getId(),
                envio.getAlert().getId(),
                envio.getAlert().getTitle(),
                envio.getRecipient(),
                envio.getStatus().name(),
                envio.getAttempts(),
                envio.getErrorMessage(),
                envio.getSentAt(),
                envio.getCreatedAt());
    }
}