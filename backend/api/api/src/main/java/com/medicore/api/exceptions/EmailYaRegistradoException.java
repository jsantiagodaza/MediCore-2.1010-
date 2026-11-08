package com.medicore.api.exceptions;

/** El email ya tiene una cuenta registrada. */
public class EmailYaRegistradoException extends RuntimeException {

    public EmailYaRegistradoException(String email) {
        super("El email ya esta registrado: " + email);
    }
}
