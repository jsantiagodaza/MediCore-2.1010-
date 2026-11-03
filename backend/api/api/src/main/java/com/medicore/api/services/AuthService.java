package com.medicore.api.services;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.HexFormat;
import java.util.Locale;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
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
 * Servicio de autenticacion.
 *
 * - Las contrasenas se guardan como hash BCrypt, nunca en texto plano.
 * - El login entrega un token aleatorio de 256 bits; en la base solo se
 *   guarda su hash SHA-256, asi que un volcado de la base no permite
 *   reutilizar sesiones.
 * - Credenciales incorrectas y usuarios inexistentes devuelven el MISMO
 *   error, para no revelar que cuentas existen.
 */
@Service
@Transactional
public class AuthService {

    public static final int MIN_PASSWORD_LENGTH = 8;
    /** BCrypt solo usa los primeros 72 bytes. */
    public static final int MAX_PASSWORD_LENGTH = 72;

    private static final DigestAlgorithm DIGEST = new DigestAlgorithm();
    private static final Duration SESSION_DURATION = Duration.ofHours(8);
    private static final int TOKEN_BYTES = 32;

    private final UserRepository userRepository;
    private final UserSessionRepository sessionRepository;
    private final PasswordEncoder passwordEncoder;
    private final SecureRandom random = new SecureRandom();

    public AuthService(UserRepository userRepository,
                       UserSessionRepository sessionRepository,
                       PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.sessionRepository = sessionRepository;
        this.passwordEncoder = passwordEncoder;
    }

    /** Crea una cuenta con la contrasena ya hasheada. */
    public User register(String email, String password, String name) {
        String correo = normalizarEmail(email);
        validarContrasena(password);

        if (userRepository.existsByEmailIgnoreCase(correo)) {
            throw new EmailYaRegistradoException(correo);
        }

        User usuario = new User(
                correo,
                limpiarNombre(name),
                passwordEncoder.encode(password),
                LocalDateTime.now());

        return userRepository.save(usuario);
    }

    /** Verifica las credenciales y emite una sesion. */
    public AuthResult login(String email, String password) {
        String correo = normalizarEmail(email);

        User usuario = userRepository.findByEmailIgnoreCase(correo)
                .orElseThrow(CredencialesInvalidasException::new);

        if (password == null || !passwordEncoder.matches(password, usuario.getPasswordHash())) {
            throw new CredencialesInvalidasException();
        }

        String token = generarToken();
        LocalDateTime ahora = LocalDateTime.now();
        LocalDateTime expira = ahora.plus(SESSION_DURATION);

        sessionRepository.save(new UserSession(usuario, hashToken(token), ahora, expira));

        return new AuthResult(usuario, token, expira);
    }

    /** Devuelve el usuario dueno de un token valido. */
    @Transactional(readOnly = true)
    public User authenticate(String token) {
        UserSession sesion = sessionRepository.findByTokenHash(hashToken(requerirToken(token)))
                .orElseThrow(TokenInvalidoException::new);

        if (!sesion.isActive(LocalDateTime.now())) {
            throw new TokenInvalidoException();
        }
        return sesion.getUser();
    }

    /** Invalida el token (no borra la fila, la marca como revocada). */
    public void logout(String token) {
        sessionRepository.findByTokenHash(hashToken(requerirToken(token)))
                .ifPresent(sesion -> {
                    sesion.setRevoked(true);
                    sessionRepository.save(sesion);
                });
    }

    // ------------------------------------------------------------------
    //  Validacion y utilidades
    // ------------------------------------------------------------------

    public String normalizarEmail(String email) {
        if (email == null || email.isBlank()) {
            throw new IllegalArgumentException("El email es obligatorio");
        }
        String correo = email.trim().toLowerCase(Locale.ROOT);
        if (!correo.contains("@") || correo.length() > 255) {
            throw new IllegalArgumentException("El email no tiene un formato valido");
        }
        return correo;
    }

    public void validarContrasena(String password) {
        if (password == null || password.length() < MIN_PASSWORD_LENGTH) {
            throw new IllegalArgumentException(
                    "La contrasena debe tener al menos " + MIN_PASSWORD_LENGTH + " caracteres");
        }
        if (password.length() > MAX_PASSWORD_LENGTH) {
            throw new IllegalArgumentException(
                    "La contrasena no puede superar " + MAX_PASSWORD_LENGTH + " caracteres");
        }
    }

    private String limpiarNombre(String name) {
        if (name == null || name.isBlank()) {
            return null;
        }
        return name.trim();
    }

    private String requerirToken(String token) {
        if (token == null || token.isBlank()) {
            throw new TokenInvalidoException();
        }
        return token.trim();
    }

    private String generarToken() {
        byte[] bytes = new byte[TOKEN_BYTES];
        random.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private String hashToken(String token) {
        return DIGEST.sha256Hex(token);
    }

    /** Pequeno envoltorio para no repetir el manejo de excepciones de digest. */
    private static final class DigestAlgorithm {

        String sha256Hex(String texto) {
            try {
                MessageDigest digest = MessageDigest.getInstance("SHA-256");
                byte[] hash = digest.digest(texto.getBytes(StandardCharsets.UTF_8));
                return HexFormat.of().formatHex(hash);
            } catch (NoSuchAlgorithmException e) {
                throw new IllegalStateException("SHA-256 no disponible", e);
            }
        }
    }
}
