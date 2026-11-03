package com.medicore.api.exceptions;

/**
 * La sesion solicitada no existe o pertenece a otro usuario.
 *
 * Se devuelve el mismo error en ambos casos: asi un usuario no puede averiguar
 * si una sesion ajena existe o no.
 */
public class SesionNoEncontradaException extends RuntimeException {

    public SesionNoEncontradaException() {
        super("La sesion no existe o no pertenece a tu cuenta");
    }
}
