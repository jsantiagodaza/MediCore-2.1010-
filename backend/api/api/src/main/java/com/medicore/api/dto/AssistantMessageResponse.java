package com.medicore.api.dto;

import java.time.Instant;
import java.util.List;
import java.util.Map;

/**
 * Respuesta estructurada del asistente.
 *
 * @param id          identificador de la respuesta (para trazabilidad en el chat)
 * @param respuesta   texto que se muestra al usuario
 * @param intent      intencion detectada: SALUDO, MEDICAMENTO,
 *                    MEDICAMENTO_NO_ENCONTRADO, EMERGENCIA, AUTOLESION,
 *                    FUERA_DE_ALCANCE o NO_ENTENDIDO (SINTOMAS queda reservada
 *                    para la fase 2)
 * @param confianza   seguridad de la intencion (0.0 a 1.0)
 * @param emergencia  true si el mensaje sugiere una urgencia medica
 * @param sugerencias acciones o consultas que el usuario puede seguir
 * @param fuentes     de donde salio la informacion
 * @param datos       datos estructurados (por ejemplo el medicamento encontrado)
 * @param timestamp   momento de la respuesta
 */
public record AssistantMessageResponse(
        String id,
        String respuesta,
        String intent,
        double confianza,
        boolean emergencia,
        List<String> sugerencias,
        List<String> fuentes,
        Map<String, Object> datos,
        Instant timestamp) {

    public static final String INTENT_SALUDO = "SALUDO";
    public static final String INTENT_MEDICAMENTO = "MEDICAMENTO";
    public static final String INTENT_SINTOMAS = "SINTOMAS";
    public static final String INTENT_EMERGENCIA = "EMERGENCIA";
    public static final String INTENT_FUERA_DE_ALCANCE = "FUERA_DE_ALCANCE";
    public static final String INTENT_NO_ENTENDIDO = "NO_ENTENDIDO";

    /** Riesgo de autolesion. Siempre viene con {@code emergencia=true}. */
    public static final String INTENT_AUTOLESION = "AUTOLESION";

    /** Pregunta por un medicamento que no esta en el catalogo. */
    public static final String INTENT_MEDICAMENTO_NO_ENCONTRADO = "MEDICAMENTO_NO_ENCONTRADO";
}
