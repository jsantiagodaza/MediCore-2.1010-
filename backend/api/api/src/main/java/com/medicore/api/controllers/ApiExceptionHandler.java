package com.medicore.api.controllers;

import java.util.LinkedHashMap;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import com.medicore.api.exceptions.CredencialesInvalidasException;
import com.medicore.api.exceptions.EmailYaRegistradoException;
import com.medicore.api.exceptions.TokenInvalidoException;

/**
 * Traduce las excepciones del dominio a respuestas HTTP claras,
 * sin exponer detalles internos ni credenciales.
 */
@RestControllerAdvice
public class ApiExceptionHandler {

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, Object>> solicitudInvalida(IllegalArgumentException e) {
        return respuesta(HttpStatus.BAD_REQUEST, "Solicitud invalida", e.getMessage());
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> datosInvalidos(MethodArgumentNotValidException e) {
        String mensaje = e.getBindingResult().getFieldErrors().stream()
                .findFirst()
                .map(error -> error.getDefaultMessage())
                .orElse("Los datos enviados no son validos");
        return respuesta(HttpStatus.BAD_REQUEST, "Datos invalidos", mensaje);
    }

    @ExceptionHandler(CredencialesInvalidasException.class)
    public ResponseEntity<Map<String, Object>> credencialesInvalidas(CredencialesInvalidasException e) {
        return respuesta(HttpStatus.UNAUTHORIZED, "No autorizado", e.getMessage());
    }

    @ExceptionHandler(TokenInvalidoException.class)
    public ResponseEntity<Map<String, Object>> tokenInvalido(TokenInvalidoException e) {
        return respuesta(HttpStatus.UNAUTHORIZED, "No autorizado", e.getMessage());
    }

    @ExceptionHandler(EmailYaRegistradoException.class)
    public ResponseEntity<Map<String, Object>> emailRegistrado(EmailYaRegistradoException e) {
        return respuesta(HttpStatus.CONFLICT, "Conflicto", e.getMessage());
    }

    private ResponseEntity<Map<String, Object>> respuesta(HttpStatus estado, String error, String mensaje) {
        Map<String, Object> cuerpo = new LinkedHashMap<>();
        cuerpo.put("error", error);
        cuerpo.put("mensaje", mensaje);
        return ResponseEntity.status(estado).body(cuerpo);
    }
}
