package com.medicore.api.controllers;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestAttribute;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.medicore.api.dto.SessionResponse;
import com.medicore.api.models.User;
import com.medicore.api.security.AuthTokenInterceptor;
import com.medicore.api.services.AuthService;

/**
 * Sesiones del propio usuario.
 *
 * Ruta privada: el interceptor ya garantizo que hay un usuario autenticado y
 * dejo el usuario y el token en atributos de la peticion. El servicio verifica
 * ademas que la sesion que se quiere revocar pertenezca a ese usuario.
 */
@RestController
@RequestMapping("/api/v1/me/sessions")
public class SessionController {

    private final AuthService authService;

    public SessionController(AuthService authService) {
        this.authService = authService;
    }

    /** GET /api/v1/me/sessions -> sesiones activas de mi cuenta */
    @GetMapping
    public List<SessionResponse> listar(
            @RequestAttribute(AuthTokenInterceptor.USUARIO_ATRIBUTO) User usuario,
            @RequestAttribute(AuthTokenInterceptor.TOKEN_ATRIBUTO) String token) {

        String huellaActual = authService.fingerprintOf(token);

        return authService.listActiveSessions(usuario).stream()
                .map(sesion -> SessionResponse.from(sesion, huellaActual))
                .toList();
    }

    /** DELETE /api/v1/me/sessions/{id} -> cierra esa sesion (solo si es mia) */
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void revocar(
            @RequestAttribute(AuthTokenInterceptor.USUARIO_ATRIBUTO) User usuario,
            @PathVariable Long id) {

        authService.revokeSession(usuario, id);
    }
}
