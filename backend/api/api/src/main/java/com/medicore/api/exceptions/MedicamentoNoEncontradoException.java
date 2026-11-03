package com.medicore.api.exceptions;

/** No existe un medicamento con el id solicitado. */
public class MedicamentoNoEncontradoException extends RuntimeException {

    public MedicamentoNoEncontradoException(Long id) {
        super("No existe un medicamento con id " + id);
    }
}
