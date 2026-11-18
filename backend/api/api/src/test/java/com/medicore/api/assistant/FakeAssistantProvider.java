package com.medicore.api.assistant;

import java.util.ArrayList;
import java.util.List;

public class FakeAssistantProvider implements AssistantProvider {

    private final List<String> consultas = new ArrayList<>();
    private String respuesta = "Respuesta simulada del modelo.";
    private AssistantProviderException.Motivo motivoFallo;
    private String detalleFallo = "fallo simulado";

    @Override
    public String responder(String pregunta) {
        consultas.add(pregunta);
        if (motivoFallo != null) {
            throw new AssistantProviderException(motivoFallo, detalleFallo);
        }
        return respuesta;
    }

    public List<String> consultas() { return consultas; }

    public int llamadas() { return consultas.size(); }

    public void responderCon(String texto) { this.respuesta = texto; }

    public void fallarCon(AssistantProviderException.Motivo motivo, String detalle) {
        this.motivoFallo = motivo;
        this.detalleFallo = detalle;
    }

    public void reiniciar() {
        consultas.clear();
        respuesta = "Respuesta simulada del modelo.";
        motivoFallo = null;
        detalleFallo = "fallo simulado";
    }
}