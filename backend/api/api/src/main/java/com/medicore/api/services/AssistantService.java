package com.medicore.api.services;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.medicore.api.dto.AssistantMessageResponse;
import com.medicore.api.models.Medicine;
import com.medicore.api.utils.TextNormalizer;

/**
 * Motor de respuestas del asistente (Mol).
 *
 * Version inicial por reglas, sin modelos externos:
 *  1. Detecta posibles urgencias y responde con prioridad a la seguridad.
 *  2. Saludos.
 *  3. Preguntas sobre un medicamento del catalogo (consulta la base de datos).
 *  4. Solicitudes de diagnostico o receta: no se responden.
 *  5. Mensajes con sintomas: orientacion general.
 *  6. Cualquier otra cosa: respuesta de "no entendi".
 *
 * TODO (#30 / #31): ampliar intenciones, afinar fallbacks y limites de seguridad.
 * TODO (#33): permitir un proveedor externo de IA manteniendo estas reglas como respaldo.
 */
@Service
@Transactional(readOnly = true)
public class AssistantService {

    private static final String AVISO_MEDICO =
            "Recuerda: soy una guia informativa, no reemplazo a un medico.";

    private static final List<String> CLAVES_EMERGENCIA = List.of(
            "dolor de pecho", "dolor en el pecho", "dolor en el brazo izquierdo",
            "no puedo respirar", "dificultad para respirar", "me falta el aire",
            "desmay", "convuls", "sangrado abundante", "sangre abundante",
            "suicid", "sobredosis", "inconsciente", "no responde", "paro cardiaco",
            "derrame cerebral", "cara torcida");

    private static final List<String> CLAVES_SALUDO = List.of(
            "hola", "buenas", "buenos dias", "buenas tardes", "buenas noches",
            "hey", "que tal", "como estas");

    private static final List<String> CLAVES_DIAGNOSTICO = List.of(
            "diagnostic", "que tengo", "que enfermedad", "que me pasa",
            "receta", "recetame", "prescri", "recipe",
            "que medicamento tomo", "cual medicamento tomo");

    private static final List<String> CLAVES_SINTOMAS = List.of(
            "dolor", "duele", "punzada", "ardor", "malestar", "fiebre", "tos",
            "nausea", "vomito", "diarrea", "mareo", "congestion", "escalofrio",
            "sangrado", "picazon", "alergia", "cansancio");

    private final MedicineService medicineService;

    public AssistantService(MedicineService medicineService) {
        this.medicineService = medicineService;
    }

    /**
     * Responde a un mensaje del usuario.
     *
     * @param mensaje texto del usuario (puede ser null o vacio)
     * @return respuesta estructurada; nunca lanza excepcion por un mensaje raro
     */
    public AssistantMessageResponse responder(String mensaje) {
        String texto = mensaje == null ? "" : mensaje.trim();
        String normalizado = TextNormalizer.normalize(texto);

        if (normalizado.isEmpty()) {
            return noEntendido();
        }
        if (contieneClave(normalizado, CLAVES_EMERGENCIA)) {
            return emergencia();
        }
        if (contieneClave(normalizado, CLAVES_SALUDO)) {
            return saludo();
        }

        Medicine medicamento = buscarMedicamentoMencionado(normalizado);
        if (medicamento != null) {
            return sobreMedicamento(medicamento);
        }
        if (contieneClave(normalizado, CLAVES_DIAGNOSTICO)) {
            return fueraDeAlcance();
        }
        if (contieneClave(normalizado, CLAVES_SINTOMAS)) {
            return orientacionSintomas();
        }
        return noEntendido();
    }

    // ------------------------------------------------------------------
    //  Intenciones
    // ------------------------------------------------------------------

    private AssistantMessageResponse emergencia() {
        return crear(
                "Lo que describes puede ser una urgencia medica. Llama ahora a la linea de "
                        + "emergencias (123 en Colombia) o acude al servicio de urgencias mas cercano. "
                        + "No esperes a que los sintomas empeoren y no te automediques.",
                AssistantMessageResponse.INTENT_EMERGENCIA,
                0.95,
                true,
                List.of("Llamar a la linea de emergencias", "Ir al servicio de urgencias mas cercano"),
                List.of("Protocolo de urgencias de MediCore"),
                Map.of());
    }

    private AssistantMessageResponse saludo() {
        return crear(
                "Hola, soy Mol, tu asistente de MediCore. Puedo darte informacion del catalogo de "
                        + "medicamentos (para que sirve, dosis habitual y precauciones), orientarte de "
                        + "forma general sobre sintomas y recordarte cuando conviene consultar a un medico. "
                        + "No puedo diagnosticar ni recetar.",
                AssistantMessageResponse.INTENT_SALUDO,
                0.9,
                false,
                List.of("Preguntar por un medicamento", "Evaluar mis sintomas", "Calcular mi IMC"),
                List.of("Asistente MediCore"),
                Map.of());
    }

    private AssistantMessageResponse sobreMedicamento(Medicine medicamento) {
        StringBuilder texto = new StringBuilder();
        texto.append(medicamento.getName())
                .append(" (").append(medicamento.getDose()).append(") - ")
                .append(medicamento.getCategory()).append(". ");

        if (medicamento.getUses() != null) {
            texto.append("Para que sirve: ").append(recortar(medicamento.getUses(), 220)).append(" ");
        }
        if (medicamento.getPosology() != null) {
            texto.append("Dosis habitual: ").append(recortar(medicamento.getPosology(), 160)).append(" ");
        }

        List<String> precauciones = medicamento.getPrecautions();
        if (precauciones != null && !precauciones.isEmpty()) {
            texto.append("Precauciones: ")
                    .append(String.join("; ", precauciones.subList(0, Math.min(2, precauciones.size()))))
                    .append(". ");
        }
        texto.append(AVISO_MEDICO);

        Map<String, Object> datos = new LinkedHashMap<>();
        datos.put("medicamentoId", medicamento.getId());
        datos.put("nombre", medicamento.getName());
        datos.put("categoria", medicamento.getCategory());
        datos.put("presentacion", medicamento.getDose());
        datos.put("precauciones", precauciones == null ? List.of() : precauciones);

        return crear(
                texto.toString(),
                AssistantMessageResponse.INTENT_MEDICAMENTO,
                0.9,
                false,
                List.of("Ver la ficha completa de " + medicamento.getName(),
                        "Preguntar por sus precauciones",
                        "Buscar otro medicamento"),
                List.of("Catalogo MediCore · " + medicamento.getName()),
                datos);
    }

    private AssistantMessageResponse fueraDeAlcance() {
        return crear(
                "No puedo diagnosticar enfermedades ni recetar medicamentos: eso requiere una "
                        + "valoracion medica. Si quieres, puedo mostrarte informacion del catalogo o "
                        + "darte orientacion general sobre tus sintomas, y siempre te recomendare "
                        + "acudir a un profesional cuando haga falta.",
                AssistantMessageResponse.INTENT_FUERA_DE_ALCANCE,
                0.8,
                false,
                List.of("Evaluar mis sintomas", "Consultar un profesional de la salud"),
                List.of("Politica de seguridad de MediCore"),
                Map.of());
    }

    private AssistantMessageResponse orientacionSintomas() {
        return crear(
                "Puedo darte orientacion general, pero no un diagnostico. Para una valoracion "
                        + "guiada usa el modulo \"Me siento mal\", que cruza tus sintomas con cuadros "
                        + "comunes y te indica cuando acudir al medico. Si el malestar es intenso, "
                        + "repentino o no mejora, consulta a un profesional.",
                AssistantMessageResponse.INTENT_SINTOMAS,
                0.6,
                false,
                List.of("Abrir Me siento mal", "Preguntar por un medicamento", "Consultar un profesional"),
                List.of("Guia de orientacion de sintomas de MediCore"),
                Map.of());
    }

    private AssistantMessageResponse noEntendido() {
        return crear(
                "No estoy seguro de haber entendido. Puedo ayudarte con informacion de "
                        + "medicamentos del catalogo (por ejemplo \"para que sirve el ibuprofeno\"), "
                        + "orientacion general de sintomas y recordatorios de cuando consultar a un medico.",
                AssistantMessageResponse.INTENT_NO_ENTENDIDO,
                0.3,
                false,
                List.of("Preguntar por un medicamento", "Evaluar mis sintomas", "Ver el catalogo"),
                List.of("Asistente MediCore"),
                Map.of());
    }

    // ------------------------------------------------------------------
    //  Utilidades
    // ------------------------------------------------------------------

    /** Devuelve el medicamento cuyo nombre aparece en el mensaje (el mas largo). */
    private Medicine buscarMedicamentoMencionado(String normalizado) {
        Medicine encontrado = null;
        int longitud = 0;

        for (Medicine medicamento : medicineService.search(null, null)) {
            String nombre = TextNormalizer.normalize(medicamento.getName());
            if (nombre.length() >= 4 && normalizado.contains(nombre) && nombre.length() > longitud) {
                encontrado = medicamento;
                longitud = nombre.length();
            }
        }
        return encontrado;
    }

    private boolean contieneClave(String textoNormalizado, List<String> claves) {
        return claves.stream().anyMatch(textoNormalizado::contains);
    }

    private String recortar(String texto, int maximo) {
        if (texto == null) {
            return "";
        }
        String limpio = texto.trim();
        return limpio.length() <= maximo ? limpio : limpio.substring(0, maximo).trim() + "...";
    }

    private AssistantMessageResponse crear(String respuesta,
                                           String intent,
                                           double confianza,
                                           boolean emergencia,
                                           List<String> sugerencias,
                                           List<String> fuentes,
                                           Map<String, Object> datos) {
        return new AssistantMessageResponse(
                UUID.randomUUID().toString(),
                respuesta,
                intent,
                confianza,
                emergencia,
                sugerencias,
                fuentes,
                datos,
                Instant.now());
    }
}
