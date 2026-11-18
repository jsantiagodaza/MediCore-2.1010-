package com.medicore.api.dto;

public record NotificationDispatchResponse(
        int enviados,
        int fallidos,
        int omitidos,
        int duplicados,
        String mensaje) {

    public static NotificationDispatchResponse deshabilitado() {
        return new NotificationDispatchResponse(0, 0, 0, 0,
                "El envio de correos esta deshabilitado (defina MAIL_ENABLED=true)");
    }
}