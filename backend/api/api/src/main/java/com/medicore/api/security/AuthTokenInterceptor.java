package com.medicore.api.security;

import java.io.IOException;

import org.springframework.http.HttpMethod;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import com.medicore.api.models.User;
import com.medicore.api.services.AuthService;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

/**
 * Exige un token de sesion valido en las rutas privadas.
 *
 * Se registra en {@link com.medicore.api.config.WebConfig}: todo /api/** queda
 * protegido salvo la lista de rutas publicas (salud, login, registro y
 * catalogo de medicamentos).
 *
 * Si el token falta, esta revocado o caduco, {@link AuthService#authenticate}
 * lanza TokenInvalidoException y ApiExceptionHandler responde 401.
 */
@Component
public class AuthTokenInterceptor implements HandlerInterceptor {

    /** Nombre del atributo donde queda el usuario autenticado. */
    public static final String USUARIO_ATRIBUTO = "usuarioAutenticado";

    /** Nombre del atributo donde queda el token de la peticion. */
    public static final String TOKEN_ATRIBUTO = "tokenAutenticado";

    private static final String PREFIJO_BEARER = "Bearer ";

    private final AuthService authService;

    public AuthTokenInterceptor(AuthService authService) {
        this.authService = authService;
    }

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler)
            throws IOException {

        // Las peticiones CORS de comprobacion (preflight) no llevan token
        if (HttpMethod.OPTIONS.matches(request.getMethod())) {
            return true;
        }

        String token = extraerToken(request.getHeader("Authorization"));
        User usuario = authService.authenticate(token);

        request.setAttribute(USUARIO_ATRIBUTO, usuario);
        request.setAttribute(TOKEN_ATRIBUTO, token);
        return true;
    }

    private String extraerToken(String authorization) {
        if (authorization == null || !authorization.startsWith(PREFIJO_BEARER)) {
            return null;
        }
        return authorization.substring(PREFIJO_BEARER.length());
    }
}
