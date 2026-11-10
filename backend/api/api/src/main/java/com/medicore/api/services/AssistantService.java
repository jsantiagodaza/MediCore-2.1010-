package com.medicore.api.services;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.regex.Pattern;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.medicore.api.dto.AssistantMessageResponse;
import com.medicore.api.models.Medicine;
import com.medicore.api.utils.TextNormalizer;

/**
 * Motor de respuestas predeterminadas del asistente (Mol).
 *
 * Funciona por reglas, sin modelos externos: el mismo mensaje da siempre la
 * misma respuesta. El texto se normaliza (minusculas, sin tildes) y se evalua
 * en este orden, deteniendose en la primera coincidencia:
 *
 *  1. Seguridad: emergencia, autolesion, manipulacion del asistente, pedido de
 *     diagnostico y pedido de dosis o receta. Va antes que todo lo demas.
 *  2. Medicamento del catalogo (por nombre o marca). Si pregunta por precio o
 *     compra se declina; si no, se responde con la ficha SIN dosis.
 *  3. Saludo.
 *  4. Sintomas: no se orienta (fuera de la fase 1), se redirige a "Me siento mal".
 *  5. Parece una pregunta por un medicamento que no esta en el catalogo.
 *  6. Cualquier otra cosa: respuesta de "no entendi".
 *
 * Las reglas de texto viven en {@link AssistantRules}. El comportamiento de
 * referencia y los casos de prueba estan en docs/assistant-intents.md y
 * docs/assistant-acceptance-cases.json.
 *
 * TODO (#31): afinar fallbacks y mensajes.
 * TODO (#33): permitir un proveedor externo de IA manteniendo estas reglas como respaldo.
 */
@Service
@Transactional(readOnly = true)
public class AssistantService {

    private static final String AVISO_MEDICO =
            "Recuerda: soy una guia informativa, no reemplazo a un medico.";

    /** Una precaucion con cifras suele ser un limite de dosis o duracion: Mol no las da. */
    private static final Pattern TIENE_CIFRAS = Pattern.compile("\\d");

    private static final Pattern REQUIERE_RECETA =
            Pattern.compile("prescrip|receta", Pattern.CASE_INSENSITIVE);

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
        String normalizado = TextNormalizer.normalize(mensaje);

        if (normalizado.isEmpty()) {
            return noEntendido();
        }

        // 1. Seguridad, siempre primero.
        AssistantRules.Seguridad seguridad = AssistantRules.clasificarSeguridad(normalizado);
        if (seguridad != null) {
            return switch (seguridad) {
                case EMERGENCIA -> emergencia();
                case AUTOLESION -> autolesion();
                case INYECCION -> manipulacion();
                case DIAGNOSTICO -> sinDiagnostico();
                case DOSIS_O_RECETA -> sinDosisNiReceta();
            };
        }

        // 2. Medicamento del catalogo.
        Medicine medicamento = buscarMedicamentoMencionado(normalizado);
        if (medicamento != null) {
            return AssistantRules.esPreguntaComercial(normalizado)
                    ? sinPreciosNiCompras()
                    : sobreMedicamento(medicamento);
        }

        // 3. Saludo.
        if (AssistantRules.esSaludo(normalizado)) {
            return saludo();
        }

        // 4. Sintomas: fuera de la fase 1.
        if (AssistantRules.mencionaSintoma(normalizado)) {
            return sintomasFueraDeAlcance();
        }

        // 5. Pregunta por un medicamento que no esta en el catalogo.
        if (AssistantRules.parecePreguntaDeMedicamento(normalizado)) {
            return medicamentoNoEncontrado();
        }

        return noEntendido();
    }

    // ------------------------------------------------------------------
    //  Seguridad
    // ------------------------------------------------------------------

    private AssistantMessageResponse emergencia() {
        return crear(
                "Lo que describes puede ser una urgencia medica. Llama ahora a la linea de "
                        + "emergencias (123 en Colombia) o acude al servicio de urgencias mas cercano. "
                        + "Si hay alguien contigo, pidele que te acompane. No esperes a que los "
                        + "sintomas empeoren y no te automediques.",
                AssistantMessageResponse.INTENT_EMERGENCIA,
                0.95,
                true,
                List.of("Llamar a la linea de emergencias (123)", "Ir al servicio de urgencias mas cercano"),
                List.of("Protocolo de urgencias de MediCore"),
                Map.of());
    }

    private AssistantMessageResponse autolesion() {
        return crear(
                "Siento mucho que estes pasando por algo tan doloroso, y me importa que estes a "
                        + "salvo. Lo que sientes merece la atencion de una persona real ahora mismo: "
                        + "si estas en peligro inmediato, llama al 123. Si puedes, busca a alguien de "
                        + "confianza que este cerca para que te acompane. Tambien puedes acudir a "
                        + "urgencias, donde te pueden ayudar de inmediato.",
                AssistantMessageResponse.INTENT_AUTOLESION,
                0.95,
                true,
                List.of("Llamar al 123", "Contactar a una persona de confianza"),
                List.of("Protocolo de urgencias de MediCore"),
                Map.of());
    }

    private AssistantMessageResponse manipulacion() {
        return crear(
                "No puedo cambiar mis reglas de seguridad ni compartir informacion interna. "
                        + "Si puedo darte informacion general sobre los medicamentos del catalogo. "
                        + "Sobre cual te gustaria saber?",
                AssistantMessageResponse.INTENT_FUERA_DE_ALCANCE,
                0.8,
                false,
                List.of("Preguntar por un medicamento"),
                List.of("Politica de seguridad de MediCore"),
                Map.of());
    }

    private AssistantMessageResponse sinDiagnostico() {
        return crear(
                "No puedo diagnosticar enfermedades ni decirte que tienes: eso requiere una "
                        + "valoracion medica. Si tienes dificultad para respirar, dolor de pecho, "
                        + "fiebre muy alta o que no cede, confusion o un sintoma que empeora rapido, "
                        + "busca atencion medica pronto. Para orientacion, consulta con tu EPS o un medico.",
                AssistantMessageResponse.INTENT_FUERA_DE_ALCANCE,
                0.85,
                false,
                List.of("Consultar un profesional de la salud", "Preguntar por un medicamento"),
                List.of("Politica de seguridad de MediCore"),
                Map.of());
    }

    private AssistantMessageResponse sinDosisNiReceta() {
        return crear(
                "No puedo indicar cantidades, horarios ni recomendar que tratamiento tomar en tu "
                        + "caso: depende de tu edad, peso, otras enfermedades, embarazo y otros "
                        + "medicamentos. Esa decision debe tomarla un medico o un farmaceutico, y en el "
                        + "empaque o el prospecto del producto encuentras la informacion oficial.",
                AssistantMessageResponse.INTENT_FUERA_DE_ALCANCE,
                0.85,
                false,
                List.of("Consultar a un farmaceutico o medico", "Leer el prospecto"),
                List.of("Politica de seguridad de MediCore"),
                Map.of());
    }

    // ------------------------------------------------------------------
    //  Medicamentos
    // ------------------------------------------------------------------

    private AssistantMessageResponse sobreMedicamento(Medicine medicamento) {
        StringBuilder texto = new StringBuilder();
        texto.append(medicamento.getName())
                .append(" (").append(medicamento.getDose()).append(") - ")
                .append(medicamento.getCategory()).append(". ");

        if (medicamento.getUses() != null) {
            texto.append("Para que sirve: ").append(recortar(medicamento.getUses(), 220)).append(" ");
        }
        if (medicamento.getWhenToTake() != null && !medicamento.getWhenToTake().isBlank()) {
            texto.append("Se usa habitualmente en: ")
                    .append(recortar(medicamento.getWhenToTake(), 160)).append(" ");
        }

        List<String> precauciones = precaucionesSinCifras(medicamento);
        if (!precauciones.isEmpty()) {
            texto.append("Precauciones y contraindicaciones: ")
                    .append(String.join("; ", precauciones.subList(0, Math.min(3, precauciones.size()))))
                    .append(". ");
        }
        if (requiereReceta(medicamento)) {
            texto.append("Importante: este medicamento requiere prescripcion medica. ");
        }
        texto.append("Las pautas de uso las define tu medico o farmaceutico y estan en el prospecto. ");
        texto.append(AVISO_MEDICO);

        Map<String, Object> datos = new LinkedHashMap<>();
        datos.put("medicamentoId", medicamento.getId());
        datos.put("nombre", medicamento.getName());
        datos.put("categoria", medicamento.getCategory());
        datos.put("presentacion", medicamento.getDose());
        datos.put("precauciones", precauciones);

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

    private AssistantMessageResponse medicamentoNoEncontrado() {
        return crear(
                "No encontre ese medicamento en el catalogo de MediCore, asi que no tengo "
                        + "informacion para darte. Revisa la ortografia o prueba con el nombre "
                        + "generico (por ejemplo: Ibuprofeno, Loratadina u Omeprazol). Para cualquier "
                        + "medicamento, el prospecto y tu farmaceutico son la fuente confiable.",
                AssistantMessageResponse.INTENT_MEDICAMENTO_NO_ENCONTRADO,
                0.7,
                false,
                List.of("Revisar la ortografia", "Ver el catalogo", "Consultar a un farmaceutico"),
                List.of("Catalogo MediCore"),
                Map.of());
    }

    private AssistantMessageResponse sinPreciosNiCompras() {
        return crear(
                "No manejo precios, compra ni disponibilidad de medicamentos: mi catalogo solo "
                        + "tiene informacion general (para que sirven, cuando se usan y sus "
                        + "precauciones). Para precios o donde conseguirlos, consulta en una farmacia.",
                AssistantMessageResponse.INTENT_FUERA_DE_ALCANCE,
                0.8,
                false,
                List.of("Consultar en una farmacia", "Preguntar por un medicamento"),
                List.of("Asistente MediCore"),
                Map.of());
    }

    // ------------------------------------------------------------------
    //  Otras intenciones
    // ------------------------------------------------------------------

    private AssistantMessageResponse saludo() {
        return crear(
                "Hola, soy Mol, tu asistente de MediCore. Puedo darte informacion de los "
                        + "medicamentos del catalogo: para que sirven, cuando se usan y sus "
                        + "precauciones. No puedo diagnosticar ni recetar.",
                AssistantMessageResponse.INTENT_SALUDO,
                0.9,
                false,
                List.of("Preguntar por un medicamento", "Ver el catalogo"),
                List.of("Asistente MediCore"),
                Map.of());
    }

    private AssistantMessageResponse sintomasFueraDeAlcance() {
        return crear(
                "Por ahora solo puedo darte informacion de los medicamentos del catalogo; no "
                        + "oriento sobre sintomas ni los diagnostico. Para una valoracion guiada usa el "
                        + "modulo \"Me siento mal\" de MediCore. Si el malestar es intenso, repentino "
                        + "o no mejora, consulta a un profesional de la salud.",
                AssistantMessageResponse.INTENT_FUERA_DE_ALCANCE,
                0.7,
                false,
                List.of("Abrir Me siento mal", "Consultar un profesional", "Preguntar por un medicamento"),
                List.of("Politica de seguridad de MediCore"),
                Map.of());
    }

    private AssistantMessageResponse noEntendido() {
        return crear(
                "No estoy seguro de haber entendido. Puedo ayudarte con informacion de "
                        + "medicamentos del catalogo (por ejemplo \"para que sirve el ibuprofeno\").",
                AssistantMessageResponse.INTENT_NO_ENTENDIDO,
                0.3,
                false,
                List.of("Preguntar por un medicamento", "Ver el catalogo"),
                List.of("Asistente MediCore"),
                Map.of());
    }

    // ------------------------------------------------------------------
    //  Utilidades
    // ------------------------------------------------------------------

    /**
     * Devuelve el medicamento del catalogo que el mensaje nombra (el nombre mas
     * largo gana: "Cafeina + Acetaminofen" antes que "Acetaminofen"), o el que
     * corresponde a una marca o alias ("Dolex" -> Acetaminofen).
     */
    private Medicine buscarMedicamentoMencionado(String normalizado) {
        List<Medicine> catalogo = medicineService.search(null, null);

        Medicine encontrado = null;
        int longitud = 0;
        for (Medicine medicamento : catalogo) {
            String nombre = nombreBuscable(medicamento);
            if (nombre.length() >= 4
                    && nombre.length() > longitud
                    && AssistantRules.contienePalabra(normalizado, nombre)) {
                encontrado = medicamento;
                longitud = nombre.length();
            }
        }
        if (encontrado != null) {
            return encontrado;
        }

        String destino = AssistantRules.resolverAlias(normalizado);
        if (destino != null) {
            for (Medicine medicamento : catalogo) {
                if (TextNormalizer.normalize(medicamento.getName()).equals(destino)) {
                    return medicamento;
                }
            }
        }
        return null;
    }

    /** Nombre normalizado; "Aloe vera crema" tambien se encuentra como "aloe vera". */
    private String nombreBuscable(Medicine medicamento) {
        return TextNormalizer.normalize(medicamento.getName()).replaceAll(" crema$", "");
    }

    /** Precauciones sin las que traen cifras (limites de dosis o duracion). */
    private List<String> precaucionesSinCifras(Medicine medicamento) {
        List<String> precauciones = medicamento.getPrecautions();
        if (precauciones == null) {
            return List.of();
        }
        return precauciones.stream()
                .filter(p -> p != null && !p.isBlank() && !TIENE_CIFRAS.matcher(p).find())
                .toList();
    }

    private boolean requiereReceta(Medicine medicamento) {
        List<String> precauciones = medicamento.getPrecautions();
        boolean enPrecauciones = precauciones != null
                && precauciones.stream().anyMatch(p -> p != null && REQUIERE_RECETA.matcher(p).find());
        String cuando = medicamento.getWhenToTake();
        return enPrecauciones || (cuando != null && REQUIERE_RECETA.matcher(cuando).find());
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
