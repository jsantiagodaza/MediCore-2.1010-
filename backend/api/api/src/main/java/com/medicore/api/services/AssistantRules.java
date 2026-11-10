package com.medicore.api.services;

import java.util.List;
import java.util.Map;
import java.util.regex.Pattern;

/**
 * Reglas de texto del asistente (Mol). Clase pura: sin Spring ni base de datos,
 * de modo que se prueba sola y da siempre el mismo resultado para el mismo texto.
 *
 * Todas las reglas esperan texto YA NORMALIZADO con
 * {@link com.medicore.api.utils.TextNormalizer#normalize(String)}
 * (minusculas, sin tildes, espacios colapsados).
 *
 * Las coincidencias usan limites de palabra: "tos" no coincide dentro de "estos".
 * Es la version en Java de {@code server/assistant/safety.js}, que es la
 * referencia de comportamiento (ver docs/assistant-intents.md).
 */
public final class AssistantRules {

    /** Categorias de seguridad, de mayor a menor prioridad. */
    public enum Seguridad {
        EMERGENCIA,
        AUTOLESION,
        INYECCION,
        DIAGNOSTICO,
        DOSIS_O_RECETA
    }

    private AssistantRules() {
    }

    private static Pattern p(String regex) {
        return Pattern.compile(regex);
    }

    // ------------------------------------------------------------------
    //  Seguridad (siempre se evalua antes que cualquier otra cosa)
    // ------------------------------------------------------------------

    private static final List<Pattern> EMERGENCIA = List.of(
            p("dolor (de |en el |en mi )?(pecho|torax)"),
            p("me duele (mucho |bastante |demasiado )?(el |mi )?(pecho|torax|corazon)"
                    + "|(pecho|corazon).{0,15}(me )?(duele|aprieta|oprime)"
                    + "|(opresion|presion|peso) en (el )?pecho"),
            p("dolor (en|de) (el )?brazo izquierdo"),
            p("me falta (el )?(aire|la respiracion)|me cuesta (mucho )?respirar"),
            p("(no puedo|dificultad (para|al)) respirar|me ahogo|falta de aire (intensa|severa|fuerte)"),
            p("perdi (el )?conocimiento|inconsciente|no reacciona|no responde|desmay"),
            p("convuls"),
            p("hemorragia|sangrado (abundante|severo|fuerte|que no (para|se detiene))|sangre abundante"),
            p("(vomito|vomitando|tos) (con )?sangre|vomite sangre|escupi sangre"
                    + "|sangre en (las )?(heces|orina)|heces negras"),
            p("(cara|labios|lengua|garganta) (hinchad|inflamad)"
                    + "|(hincharon|inflamaron) (la |los |mi |las )?(cara|labios|lengua|garganta)"
                    + "|hinchazon (de |en )?(la )?(cara|lengua|garganta|labios)|anafila"),
            p("sobredosis|intoxicacion|envenen|me tome (todas|muchas|un monton)"),
            p("cara (caida|torcida)|no puedo (mover|hablar)|habla (arrastrada|confusa)"
                    + "|derrame|paralisis|paro cardiaco"),
            p("(bebe|recien nacido).*(fiebre|no respira|morado)"));

    private static final List<Pattern> AUTOLESION = List.of(
            p("suicid|quitarme la vida|quiero morir|no quiero (seguir )?viviendo|no quiero vivir"
                    + "|acabar con (mi vida|todo)|ganas de morir|quisiera (no existir|desaparecer)"
                    + "|mejor (estar )?muert[oa]|matarme|terminar con mi vida"
                    + "|hacerme (dano|algo malo)|(me )?quiero (hacer|causar)(me)? dano"));

    private static final List<Pattern> INYECCION = List.of(
            p("ignora (todas )?(tus|las) (instrucciones|reglas)|olvida (tus|las) (instrucciones|reglas)"),
            p("(muestra|muestrame|dime|revela|imprime).{0,30}"
                    + "(system prompt|prompt del sistema|instrucciones internas|api ?key|clave)"),
            p("actua como (un )?(medico|doctor)|modo (desarrollador|sin restricciones)"
                    + "|jailbreak|ignore (all )?(previous|prior) instructions"));

    private static final List<Pattern> DIAGNOSTICO = List.of(
            p("diagnostic(a|ame|o)|que (enfermedad|tengo|me pasa|podria tener|puedo tener)"
                    + "|cual es mi enfermedad"),
            p("\\b(tengo|tendre|sera) (cancer|covid|dengue|diabetes|vih|neumonia|infarto|apendicitis)"),
            p("es grave\\b|me estoy muriendo|estoy enferm[oa] de"));

    private static final List<Pattern> DOSIS_O_RECETA = List.of(
            p("\\bdosis\\b"
                    + "|cuant[oa]s?\\b(?!.*\\b(agua|liquidos?|litros|vasos)\\b).{0,40}"
                    + "\\b(tomar|tomo|aplicar|aplico|darle|dar)\\b"
                    + "|cada cuantas horas|cuantas (pastillas|tabletas|gotas)"),
            p("recetame|recetarme|formulame|prescribeme|prescribirme"
                    + "|(dame|necesito|quiero|pido|pedir) (una )?(receta|formula medica)"
                    + "|recomiendame (un )?(medicamento|antibiotico|pastilla)"
                    + "|que (medicamento|pastilla|antibiotico) (me )?(tomo|debo tomar|puedo tomar)"
                    + "|que me (tomo|recomiendas tomar)"),
            p("puedo (tomar|mezclar|combinar).{0,40}(con|junto)|mezclar .* con|combinar .* con"),
            p("(para|a) (mi )?(hij[oa]|bebe|nino|nina|embarazada|mama|papa|abuel[oa])\\b"
                    + ".*(tomar|dar|darle|medicamento|pastilla)"),
            p("(estoy|esta) (embarazada|lactando)"));

    /**
     * Devuelve la categoria de seguridad mas prioritaria del mensaje, o null.
     * El orden es la prioridad: emergencia, autolesion, manipulacion,
     * pedido de diagnostico, pedido de dosis o receta.
     */
    public static Seguridad clasificarSeguridad(String normalizado) {
        if (normalizado == null || normalizado.isEmpty()) {
            return null;
        }
        if (coincide(EMERGENCIA, normalizado)) {
            return Seguridad.EMERGENCIA;
        }
        if (coincide(AUTOLESION, normalizado)) {
            return Seguridad.AUTOLESION;
        }
        if (coincide(INYECCION, normalizado)) {
            return Seguridad.INYECCION;
        }
        if (coincide(DIAGNOSTICO, normalizado)) {
            return Seguridad.DIAGNOSTICO;
        }
        if (coincide(DOSIS_O_RECETA, normalizado)) {
            return Seguridad.DOSIS_O_RECETA;
        }
        return null;
    }

    // ------------------------------------------------------------------
    //  Otras intenciones
    // ------------------------------------------------------------------

    private static final Pattern SALUDO = p(
            "^(hola|holi|buenas|buenos dias|buenas tardes|buenas noches|hey|que tal|como estas)\\b");

    /** Precios, compra o disponibilidad: no son informacion del catalogo. */
    private static final Pattern COMERCIAL = p(
            "cuesta|precio|cuanto vale|cuanto sale|mas barato|comprar|disponib|descuento"
                    + "|donde (lo |la )?(compro|consigo|venden|encuentro)"
                    + "|(marca|generico).{0,25}(mejor|recomend)|cual es mejor");

    /** Parece una pregunta de informacion de un medicamento. */
    private static final Pattern PREGUNTA_DE_MEDICAMENTO = p(
            "para que (sirve|se usa|es)|contraindic|precauc|informacion (de|del|de la|sobre)"
                    + "|hablame (de|del|sobre)|que (sabes|me dices) (de|del|sobre)");

    private static final Pattern SINTOMA = p(
            "\\b(dolor|duele|duelen|punzada|ardor|malestar|fiebre|tos|nausea|nauseas|vomito"
                    + "|diarrea|mareo|congestion|escalofrio|escalofrios|sangrado|picazon"
                    + "|alergia|cansancio)\\b");

    /** Nombres alternativos (normalizados) -> nombre del catalogo (normalizado). */
    private static final Map<String, String> ALIAS = Map.of(
            "paracetamol", "acetaminofen",
            "dolex", "acetaminofen",
            "vitamina d", "vitamina d3",
            "sro", "suero oral (sro)",
            "suero oral", "suero oral (sro)");

    public static boolean esSaludo(String normalizado) {
        return SALUDO.matcher(normalizado).find();
    }

    public static boolean esPreguntaComercial(String normalizado) {
        return COMERCIAL.matcher(normalizado).find();
    }

    public static boolean parecePreguntaDeMedicamento(String normalizado) {
        return PREGUNTA_DE_MEDICAMENTO.matcher(normalizado).find();
    }

    public static boolean mencionaSintoma(String normalizado) {
        return SINTOMA.matcher(normalizado).find();
    }

    /**
     * @return el nombre (normalizado) del catalogo al que apunta un alias o una
     *         marca citada en el mensaje, o null si no hay ninguno
     */
    public static String resolverAlias(String normalizado) {
        for (Map.Entry<String, String> alias : ALIAS.entrySet()) {
            if (contienePalabra(normalizado, alias.getKey())) {
                return alias.getValue();
            }
        }
        return null;
    }

    /** true si {@code termino} aparece en {@code texto} como palabra o frase completa. */
    public static boolean contienePalabra(String texto, String termino) {
        if (texto == null || termino == null || termino.isEmpty()) {
            return false;
        }
        int desde = 0;
        while (true) {
            int pos = texto.indexOf(termino, desde);
            if (pos < 0) {
                return false;
            }
            int fin = pos + termino.length();
            boolean inicioOk = pos == 0 || !Character.isLetterOrDigit(texto.charAt(pos - 1));
            boolean finOk = fin == texto.length() || !Character.isLetterOrDigit(texto.charAt(fin));
            if (inicioOk && finOk) {
                return true;
            }
            desde = pos + 1;
        }
    }

    private static boolean coincide(List<Pattern> reglas, String texto) {
        for (Pattern regla : reglas) {
            if (regla.matcher(texto).find()) {
                return true;
            }
        }
        return false;
    }
}
