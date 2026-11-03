package com.medicore.api.exceptions;

/** Token de sesion ausente, invalido, revocado o caducado. */
public class TokenInvalidoException extends RuntimeException {

    public TokenInvalidoException() {
        super("Sesion no valida o caducada. Vuelve a iniciar sesion");
    }
}
