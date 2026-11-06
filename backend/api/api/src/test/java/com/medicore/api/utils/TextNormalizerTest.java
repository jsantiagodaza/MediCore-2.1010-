package com.medicore.api.utils;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * Pruebas unitarias puras: no necesitan Spring ni base de datos.
 */
class TextNormalizerTest {

    @Test
    @DisplayName("quita tildes y pasa a minusculas")
    void quitaTildes() {
        assertEquals("acetaminofen", TextNormalizer.normalize("Acetaminofén"));
        assertEquals("acido folico", TextNormalizer.normalize("ÁCIDO FÓLICO"));
        assertEquals("dermatologico", TextNormalizer.normalize("Dermatológico"));
        assertEquals("nauseas", TextNormalizer.normalize("Náuseas"));
    }

    @Test
    @DisplayName("recorta y colapsa espacios")
    void normalizaEspacios() {
        assertEquals("ibuprofeno", TextNormalizer.normalize("   Ibuprofeno   "));
        assertEquals("dolor de cabeza", TextNormalizer.normalize("Dolor   de   cabeza"));
    }

    @Test
    @DisplayName("null se convierte en cadena vacia")
    void nullEsVacio() {
        assertEquals("", TextNormalizer.normalize(null));
    }

    @Test
    @DisplayName("contains compara normalizado")
    void containsNormalizado() {
        assertTrue(TextNormalizer.contains("Acetaminofén", "acetaminofen"));
        assertTrue(TextNormalizer.contains("Dermatológico", "dermatolog"));
        assertFalse(TextNormalizer.contains("Ibuprofeno", "acetaminofen"));
        assertFalse(TextNormalizer.contains(null, "algo"));
        assertFalse(TextNormalizer.contains("algo", ""));
    }
}
