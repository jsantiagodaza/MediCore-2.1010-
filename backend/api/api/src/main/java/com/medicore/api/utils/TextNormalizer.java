package com.medicore.api.utils;

import java.text.Normalizer;
import java.util.Locale;

/**
 * Normalizacion de texto para busquedas.
 *
 * Convierte "Acetaminofén" en "acetaminofen", de modo que el usuario pueda
 * escribir sin tildes ni mayusculas y encontrar igual el medicamento.
 */
public final class TextNormalizer {

    private TextNormalizer() {
    }

    /**
     * Pasa el texto a minusculas, quita tildes/diacriticos y colapsa espacios.
     * Devuelve cadena vacia si el texto es null.
     */
    public static String normalize(String text) {
        if (text == null) {
            return "";
        }
        String descompuesto = Normalizer.normalize(text, Normalizer.Form.NFD);
        String sinTildes = descompuesto.replaceAll("\\p{M}+", "");
        return sinTildes.toLowerCase(Locale.ROOT).trim().replaceAll("\\s+", " ");
    }

    /**
     * @param text   texto donde buscar (puede ser null)
     * @param term   termino ya normalizado (no vacio)
     * @return true si el texto normalizado contiene el termino
     */
    public static boolean contains(String text, String term) {
        if (term == null || term.isEmpty()) {
            return false;
        }
        return normalize(text).contains(term);
    }
}
