package com.medicore.api.dto;

import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import com.medicore.api.services.AssistantChatService;

public record AssistantChatResponse(
        String id,
        String respuesta,
        String reply,
        String disclaimer,
        String intent,
        double confianza,
        boolean emergencia,
        List<String> sugerencias,
        List<String> suggested_actions,
        List<String> fuentes,
        Map<String, Object> datos,
        String origen,
        String modelo,
        Long latenciaMs,
        Instant timestamp) {

    public static final String ORIGEN_REGLAS = "REGLAS";
    public static final String ORIGEN_MODELO = "MODELO";
    public static final String ORIGEN_RESPALDO = "RESPALDO";

    public static final String DISCLAIMER =
            "Soy Mol, una guia informativa. No reemplazo la consulta medica ni entrego diagnosticos.";

    public static AssistantChatResponse desdeReglas(AssistantMessageResponse original) {
        return new AssistantChatResponse(
                original.id(),
                original.respuesta(),
                original.respuesta(),
                DISCLAIMER,
                original.intent(),
                original.confianza(),
                original.emergencia(),
                original.sugerencias(),
                original.sugerencias(),
                original.fuentes(),
                original.datos(),
                ORIGEN_REGLAS,
                null,
                null,
                original.timestamp());
    }

    public static AssistantChatResponse desdeModelo(AssistantMessageResponse base,
                                                    String textoModelo,
                                                    String modelo,
                                                    long latenciaMs) {
        Map<String, Object> datos = conOrigen(base.datos(), ORIGEN_MODELO);
        datos.put("modelo", modelo);
        datos.put("latenciaMs", latenciaMs);

        List<String> fuentes = new ArrayList<>(base.fuentes() == null ? List.of() : base.fuentes());
        fuentes.add("Modelo de IA: " + modelo);

        return new AssistantChatResponse(
                base.id(),
                textoModelo,
                textoModelo,
                DISCLAIMER,
                AssistantChatService.INTENT_RESPUESTA_MODELO,
                0.6,
                false,
                base.sugerencias(),
                base.sugerencias(),
                fuentes,
                datos,
                ORIGEN_MODELO,
                modelo,
                latenciaMs,
                Instant.now());
    }

    public static AssistantChatResponse respaldo(AssistantMessageResponse base, String mensaje) {
        Map<String, Object> datos = conOrigen(base.datos(), ORIGEN_RESPALDO);

        return new AssistantChatResponse(
                base.id(),
                mensaje,
                mensaje,
                DISCLAIMER,
                base.intent(),
                base.confianza(),
                base.emergencia(),
                base.sugerencias(),
                base.sugerencias(),
                base.fuentes(),
                datos,
                ORIGEN_RESPALDO,
                null,
                null,
                Instant.now());
    }

    private static Map<String, Object> conOrigen(Map<String, Object> original, String origen) {
        Map<String, Object> datos = new LinkedHashMap<>();
        if (original != null) {
            datos.putAll(original);
        }
        datos.put("origen", origen);
        return datos;
    }
}