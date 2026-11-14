package com.medicore.api.assistant;

public class AssistantProviderException extends RuntimeException {

    public enum Motivo {
        TIEMPO_AGOTADO,
        ERROR_PROVEEDOR,
        SIN_CONFIGURACION
    }

    private final Motivo motivo;

    public AssistantProviderException(Motivo motivo, String detalle) {
        super(detalle);
        this.motivo = motivo;
    }

    public Motivo getMotivo() {
        return motivo;
    }
}