package com.medicore.api.models;

import java.text.Normalizer;
import java.util.Locale;

public enum RiskLevel {

    BAJO,
    MEDIO,
    ALTO,
    CRITICO;

    public static RiskLevel from(String valor) {
        if (valor == null || valor.isBlank()) {
            throw new IllegalArgumentException(
                    "El nivel de riesgo es obligatorio. Valores permitidos: bajo, medio, alto, critico");
        }
        String limpio = Normalizer.normalize(valor.trim(), Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .toUpperCase(Locale.ROOT);
        try {
            return RiskLevel.valueOf(limpio);
        } catch (IllegalArgumentException error) {
            throw new IllegalArgumentException("El nivel de riesgo '" + valor.trim()
                    + "' no es valido. Valores permitidos: bajo, medio, alto, critico");
        }
    }
}