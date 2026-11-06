package com.medicore.api.services;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import com.medicore.api.dto.AuthResult;
import com.medicore.api.exceptions.CredencialesInvalidasException;
import com.medicore.api.exceptions.EmailYaRegistradoException;
import com.medicore.api.exceptions.TokenInvalidoException;
import com.medicore.api.models.User;
import com.medicore.api.models.UserSession;
import com.medicore.api.repositories.UserRepository;
import com.medicore.api.repositories.UserSessionRepository;

/**
 * Pruebas del servicio de autenticacion, sin pasar por el controlador ni por HTTP.
 * Cada prueba se revierte gracias a @Transactional.
 */
@SpringBootTest
@ActiveProfiles("dev")
@Transactional
class AuthServiceTest {

    private static final String PASSWORD = "Contrasena123";

    @Autowired
    private AuthService authService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private UserSessionRepository sessionRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    // ------------------------------------------------------------------
    //  Registro y hashing
    // ------------------------------------------------------------------

    @Test
    @DisplayName("la contrasena se guarda como hash BCrypt, nunca en texto plano")
    void guardaHashBcrypt() {
        User usuario = authService.register("Test@Correo.COM ", PASSWORD, "Jainer");

        assertEquals("test@correo.com", usuario.getEmail(), "el email se normaliza");

        String hash = usuario.getPasswordHash();
        assertNotNull(hash);
        assertNotEquals(PASSWORD, hash, "no puede guardarse la contrasena original");
        assertFalse(hash.contains(PASSWORD), "el hash no contiene la contrasena");
        assertTrue(hash.startsWith("$2"), "debe ser un hash BCrypt");
        assertTrue(passwordEncoder.matches(PASSWORD, hash), "BCrypt debe poder verificarlo");
    }

    @Test
    @DisplayName("dos usuarios con la misma contrasena tienen hashes distintos (salt)")
    void hashesDiferentesPorSalt() {
        User a = authService.register("a@medicore.com", PASSWORD, null);
        User b = authService.register("b@medicore.com", PASSWORD, null);

        assertNotEquals(a.getPasswordHash(), b.getPasswordHash());
    }

    @Test
    @DisplayName("no se permite registrar dos veces el mismo email")
    void emailDuplicado() {
        authService.register("duplicado@medicore.com", PASSWORD, null);

        assertThrows(EmailYaRegistradoException.class,
                () -> authService.register("DUPLICADO@medicore.com", PASSWORD, null));
    }

    @Test
    @DisplayName("contrasena demasiado corta o demasiado larga se rechaza")
    void contrasenaInvalida() {
        assertThrows(IllegalArgumentException.class,
                () -> authService.register("corta@medicore.com", "1234567", null));
        assertThrows(IllegalArgumentException.class,
                () -> authService.register("larga@medicore.com", "a".repeat(73), null));
    }

    @Test
    @DisplayName("email sin formato valido se rechaza")
    void emailInvalido() {
        assertThrows(IllegalArgumentException.class,
                () -> authService.register("sin-arroba", PASSWORD, null));
    }

    // ------------------------------------------------------------------
    //  Login y sesion
    // ------------------------------------------------------------------

    @Test
    @DisplayName("login correcto emite un token de sesion")
    void loginCorrecto() {
        User usuario = authService.register("login@medicore.com", PASSWORD, "Jainer");

        AuthResult resultado = authService.login("login@medicore.com", PASSWORD);

        assertNotNull(resultado.token());
        assertTrue(resultado.token().length() >= 40, "el token debe ser largo y aleatorio");
        assertNotNull(resultado.expiresAt());
        assertEquals(usuario.getId(), resultado.user().getId());
    }

    @Test
    @DisplayName("el email no distingue mayusculas ni espacios al iniciar sesion")
    void loginNormalizaEmail() {
        authService.register("MiCuenta@Medicore.com", PASSWORD, null);

        AuthResult resultado = authService.login("  micuenta@medicore.COM  ", PASSWORD);

        assertNotNull(resultado.token());
    }

    @Test
    @DisplayName("contrasena incorrecta es rechazada")
    void contrasenaIncorrecta() {
        authService.register("fallo@medicore.com", PASSWORD, null);

        assertThrows(CredencialesInvalidasException.class,
                () -> authService.login("fallo@medicore.com", "OtraContrasena1"));
    }

    @Test
    @DisplayName("email inexistente devuelve el mismo error que contrasena mala")
    void emailInexistenteMismoError() {
        CredencialesInvalidasException error = assertThrows(CredencialesInvalidasException.class,
                () -> authService.login("nadie@medicore.com", PASSWORD));

        assertEquals("Email o contrasena incorrectos", error.getMessage());
    }

    @Test
    @DisplayName("el token no se guarda en claro en la base de datos")
    void tokenNoSeGuardaEnClaro() {
        authService.register("token@medicore.com", PASSWORD, null);
        AuthResult resultado = authService.login("token@medicore.com", PASSWORD);

        UserSession sesion = sessionRepository.findAll().get(0);

        assertNotEquals(resultado.token(), sesion.getTokenHash());
        assertEquals(64, sesion.getTokenHash().length(), "se guarda el SHA-256 en hexadecimal");
        assertFalse(sesion.isRevoked());
    }

    @Test
    @DisplayName("un token valido identifica al usuario")
    void authenticateDevuelveUsuario() {
        User usuario = authService.register("me@medicore.com", PASSWORD, "Jainer");
        String token = authService.login("me@medicore.com", PASSWORD).token();

        User autenticado = authService.authenticate(token);

        assertEquals(usuario.getId(), autenticado.getId());
        assertEquals("me@medicore.com", autenticado.getEmail());
    }

    @Test
    @DisplayName("token invalido o vacio es rechazado")
    void tokenInvalido() {
        assertThrows(TokenInvalidoException.class, () -> authService.authenticate("token-que-no-existe"));
        assertThrows(TokenInvalidoException.class, () -> authService.authenticate(""));
        assertThrows(TokenInvalidoException.class, () -> authService.authenticate(null));
    }

    @Test
    @DisplayName("una sesion caducada no autentica")
    void sesionCaducada() {
        authService.register("caduca@medicore.com", PASSWORD, null);
        String token = authService.login("caduca@medicore.com", PASSWORD).token();

        UserSession sesion = sessionRepository.findAll().get(0);
        sesion.setExpiresAt(sesion.getExpiresAt().minusDays(1));
        sessionRepository.save(sesion);

        assertThrows(TokenInvalidoException.class, () -> authService.authenticate(token));
    }

    @Test
    @DisplayName("logout revoca el token")
    void logoutRevoca() {
        authService.register("salir@medicore.com", PASSWORD, null);
        String token = authService.login("salir@medicore.com", PASSWORD).token();

        authService.logout(token);

        assertThrows(TokenInvalidoException.class, () -> authService.authenticate(token));
    }
}
