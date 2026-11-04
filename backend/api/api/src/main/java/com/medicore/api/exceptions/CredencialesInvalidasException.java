package com.medicore.api.exceptions;

/**
 * Credenciales incorrectas al iniciar sesion.
 *
 * El mensaje es siempre el mismo tanto si el email no existe como si la
 * contrasena no coincide: asi no se puede averiguar que usuarios existen.
 */
public class CredencialesInvalidasException extends RuntimeException {

    public CredencialesInvalidasException() {
        super("Email o contrasena incorrectos");
    }
}
