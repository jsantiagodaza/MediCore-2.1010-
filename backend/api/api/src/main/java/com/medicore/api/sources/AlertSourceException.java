package com.medicore.api.sources;

public class AlertSourceException extends RuntimeException {

    public enum Motivo {
        NO_DISPONIBLE,
        DATOS_INVALIDOS
    }

    private final Motivo motivo;

    public AlertSourceException(Motivo motivo, String detalle) {
        super(detalle);
        this.motivo = motivo;
    }

    public Motivo getMotivo() {
        return motivo;
    }
}