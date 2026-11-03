package com.medicore.api.controllers;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataAccessException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.servlet.NoHandlerFoundException;
import org.springframework.web.servlet.resource.NoResourceFoundException;

import com.medicore.api.exceptions.CredencialesInvalidasException;
import com.medicore.api.exceptions.EmailYaRegistradoException;
import com.medicore.api.exceptions.SesionNoEncontradaException;
import com.medicore.api.exceptions.TokenInvalidoException;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.ValidationException;

/**
 * Manejo global de errores.
 *
 * Todas las respuestas de error tienen la misma forma:
 *
 * <pre>
 * {
 *   "status": 400,
 *   "error": "Solicitud invalida",
 *   "mensaje": "descripcion para el usuario",
 *   "path": "/api/v1/medicines",
 *   "timestamp": "2026-11-03T19:00:00Z"
 * }
 * </pre>
 *
 * Las excepciones no controladas (500) se registran completas en el log del
 * servidor, pero al cliente solo le llega un mensaje generico: nunca el stack
 * trace, el nombre de la clase, la consulta SQL ni credenciales.
 */
@RestControllerAdvice
public class ApiExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(ApiExceptionHandler.class);

    private static final String MENSAJE_GENERICO =
            "Ocurrio un error inesperado. Intenta de nuevo o contacta al administrador";

    // ------------------------------------------------------------------
    //  400 - peticiones mal formadas
    // ------------------------------------------------------------------

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, Object>> solicitudInvalida(IllegalArgumentException e,
                                                                HttpServletRequest request) {
        return respuesta(HttpStatus.BAD_REQUEST, "Solicitud invalida", e.getMessage(), request);
    }

    @ExceptionHandler(ValidationException.class)
    public ResponseEntity<Map<String, Object>> validacion(ValidationException e,
                                                          HttpServletRequest request) {
        return respuesta(HttpStatus.BAD_REQUEST, "Datos invalidos", e.getMessage(), request);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> datosInvalidos(MethodArgumentNotValidException e,
                                                              HttpServletRequest request) {
        String mensaje = e.getBindingResult().getFieldErrors().stream()
                .findFirst()
                .map(error -> error.getDefaultMessage())
                .orElse("Los datos enviados no son validos");

        return respuesta(HttpStatus.BAD_REQUEST, "Datos invalidos", mensaje, request);
    }

    /** El cuerpo de la peticion no es JSON valido (o falta el Content-Type). */
    @ExceptionHandler(org.springframework.http.converter.HttpMessageNotReadableException.class)
    public ResponseEntity<Map<String, Object>> cuerpoIlegible(
            org.springframework.http.converter.HttpMessageNotReadableException e,
            HttpServletRequest request) {

        return respuesta(HttpStatus.BAD_REQUEST, "Cuerpo invalido",
                "El cuerpo de la peticion debe ser JSON valido", request);
    }

    /** Un parametro tiene el tipo equivocado, por ejemplo /medicines/abc. */
    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<Map<String, Object>> tipoIncorrecto(MethodArgumentTypeMismatchException e,
                                                              HttpServletRequest request) {
        // Se nombra el parametro, pero no se repite su valor
        return respuesta(HttpStatus.BAD_REQUEST, "Parametro invalido",
                "El parametro '" + e.getName() + "' tiene un formato incorrecto", request);
    }

    // ------------------------------------------------------------------
    //  401 / 403 / 404 / 405 / 409 - errores de dominio o de ruta
    // ------------------------------------------------------------------

    @ExceptionHandler(CredencialesInvalidasException.class)
    public ResponseEntity<Map<String, Object>> credencialesInvalidas(CredencialesInvalidasException e,
                                                                    HttpServletRequest request) {
        return respuesta(HttpStatus.UNAUTHORIZED, "No autorizado", e.getMessage(), request);
    }

    @ExceptionHandler(TokenInvalidoException.class)
    public ResponseEntity<Map<String, Object>> tokenInvalido(TokenInvalidoException e,
                                                            HttpServletRequest request) {
        return respuesta(HttpStatus.UNAUTHORIZED, "No autorizado", e.getMessage(), request);
    }

    @ExceptionHandler(EmailYaRegistradoException.class)
    public ResponseEntity<Map<String, Object>> emailRegistrado(EmailYaRegistradoException e,
                                                              HttpServletRequest request) {
        return respuesta(HttpStatus.CONFLICT, "Conflicto", e.getMessage(), request);
    }

    @ExceptionHandler(SesionNoEncontradaException.class)
    public ResponseEntity<Map<String, Object>> sesionNoEncontrada(SesionNoEncontradaException e,
                                                                 HttpServletRequest request) {
        return respuesta(HttpStatus.NOT_FOUND, "No encontrado", e.getMessage(), request);
    }

    @ExceptionHandler({ NoResourceFoundException.class, NoHandlerFoundException.class })
    public ResponseEntity<Map<String, Object>> rutaNoExiste(Exception e, HttpServletRequest request) {
        return respuesta(HttpStatus.NOT_FOUND, "No encontrado",
                "La ruta solicitada no existe", request);
    }

    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    public ResponseEntity<Map<String, Object>> metodoNoSoportado(HttpRequestMethodNotSupportedException e,
                                                                HttpServletRequest request) {
        return respuesta(HttpStatus.METHOD_NOT_ALLOWED, "Metodo no permitido",
                "El metodo " + e.getMethod() + " no esta permitido en esta ruta", request);
    }

    // ------------------------------------------------------------------
    //  500 / 503 - fallos internos
    // ------------------------------------------------------------------

    /** La base de datos no responde. */
    @ExceptionHandler(DataAccessException.class)
    public ResponseEntity<Map<String, Object>> errorDeBaseDeDatos(DataAccessException e,
                                                                  HttpServletRequest request) {
        log.error("Fallo de acceso a datos en {}", request.getRequestURI(), e);

        return respuesta(HttpStatus.SERVICE_UNAVAILABLE, "Servicio no disponible",
                "La base de datos no esta disponible en este momento", request);
    }

    /** Cualquier otra excepcion: se registra, pero no se revela. */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> errorInterno(Exception e, HttpServletRequest request) {
        log.error("Error no controlado en {}", request.getRequestURI(), e);

        return respuesta(HttpStatus.INTERNAL_SERVER_ERROR, "Error interno", MENSAJE_GENERICO, request);
    }

    // ------------------------------------------------------------------

    private ResponseEntity<Map<String, Object>> respuesta(HttpStatus estado, String error,
                                                          String mensaje, HttpServletRequest request) {
        Map<String, Object> cuerpo = new LinkedHashMap<>();
        cuerpo.put("status", estado.value());
        cuerpo.put("error", error);
        cuerpo.put("mensaje", mensaje);
        cuerpo.put("path", request == null ? null : request.getRequestURI());
        cuerpo.put("timestamp", Instant.now().toString());

        return ResponseEntity.status(estado).body(cuerpo);
    }
}
