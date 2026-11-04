package com.medicore.api.security;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.LocalDateTime;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.medicore.api.dto.LoginRequest;
import com.medicore.api.models.User;
import com.medicore.api.repositories.UserSessionRepository;
import com.medicore.api.services.AuthService;

/**
 * Pruebas de la proteccion de endpoints: rutas publicas, rutas privadas,
 * autorizacion entre usuarios y cierre de sesion.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("dev")
@Transactional
class EndpointSecurityTest {

    private static final String PASSWORD = "Contrasena123";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper json;

    @Autowired
    private AuthService authService;

    @Autowired
    private UserSessionRepository sessionRepository;

    private String iniciarSesion(String email) throws Exception {
        String cuerpo = json.writeValueAsString(new LoginRequest(email, PASSWORD));

        String respuesta = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(cuerpo))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        return json.readTree(respuesta).get("token").asText();
    }

    // ------------------------------------------------------------------
    //  Rutas publicas
    // ------------------------------------------------------------------

    @Test
    @DisplayName("las rutas publicas responden sin token")
    void rutasPublicasSinToken() throws Exception {
        mockMvc.perform(get("/api/v1/health")).andExpect(status().isOk());
        mockMvc.perform(get("/api/v1/health/db")).andExpect(status().isOk());
        mockMvc.perform(get("/api/v1/medicines")).andExpect(status().isOk());
        mockMvc.perform(get("/api/v1/medicines/categories")).andExpect(status().isOk());
        mockMvc.perform(get("/api/v1/medicines?search=ibuprofeno")).andExpect(status().isOk());
    }

    @Test
    @DisplayName("se puede registrar e iniciar sesion sin token")
    void loginYRegistroPublicos() throws Exception {
        String cuerpo = json.writeValueAsString(
                new com.medicore.api.dto.RegisterRequest("publico@medicore.com", PASSWORD, "Nuevo"));

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(cuerpo))
                .andExpect(status().isCreated());

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(new LoginRequest("publico@medicore.com", PASSWORD))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty());
    }

    // ------------------------------------------------------------------
    //  Rutas privadas
    // ------------------------------------------------------------------

    @Test
    @DisplayName("las rutas privadas rechazan solicitudes sin token")
    void rutasPrivadasSinToken() throws Exception {
        mockMvc.perform(get("/api/v1/auth/me")).andExpect(status().isUnauthorized());
        mockMvc.perform(post("/api/v1/auth/logout")).andExpect(status().isUnauthorized());
        mockMvc.perform(get("/api/v1/me/sessions")).andExpect(status().isUnauthorized());
        mockMvc.perform(delete("/api/v1/me/sessions/1")).andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("un token inventado es rechazado")
    void tokenInvalido() throws Exception {
        mockMvc.perform(get("/api/v1/auth/me")
                        .header("Authorization", "Bearer token-que-no-existe"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("con token valido se accede a las rutas privadas")
    void conTokenValido() throws Exception {
        authService.register("privado@medicore.com", PASSWORD, "Privado");
        String token = iniciarSesion("privado@medicore.com");

        mockMvc.perform(get("/api/v1/auth/me").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("privado@medicore.com"));

        mockMvc.perform(get("/api/v1/me/sessions").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].current").value(true));
    }

    // ------------------------------------------------------------------
    //  Cierre de sesion
    // ------------------------------------------------------------------

    @Test
    @DisplayName("el logout invalida el token para las rutas privadas")
    void logoutInvalidaElToken() throws Exception {
        authService.register("logout@medicore.com", PASSWORD, null);
        String token = iniciarSesion("logout@medicore.com");

        mockMvc.perform(post("/api/v1/auth/logout").header("Authorization", "Bearer " + token))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/v1/auth/me").header("Authorization", "Bearer " + token))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(get("/api/v1/me/sessions").header("Authorization", "Bearer " + token))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("un usuario no puede revocar la sesion de otro")
    void noPuedeRevocarSesionAjena() throws Exception {
        User otro = authService.register("otro@medicore.com", PASSWORD, null);
        String tokenOtro = iniciarSesion("otro@medicore.com");
        Long idSesionAjena = sessionRepository
                .findByUserAndRevokedFalseAndExpiresAtAfterOrderByCreatedAtDesc(otro, LocalDateTime.now())
                .get(0)
                .getId();

        authService.register("intruso@medicore.com", PASSWORD, null);
        String tokenIntruso = iniciarSesion("intruso@medicore.com");

        mockMvc.perform(delete("/api/v1/me/sessions/" + idSesionAjena)
                        .header("Authorization", "Bearer " + tokenIntruso))
                .andExpect(status().isNotFound());

        // la sesion del otro usuario sigue funcionando
        mockMvc.perform(get("/api/v1/auth/me").header("Authorization", "Bearer " + tokenOtro))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("se puede cerrar una sesion propia y solo esa")
    void revocarSesionPropia() throws Exception {
        authService.register("dos@medicore.com", PASSWORD, null);

        String token1 = iniciarSesion("dos@medicore.com");
        String token2 = iniciarSesion("dos@medicore.com");

        String respuesta = mockMvc.perform(get("/api/v1/me/sessions")
                        .header("Authorization", "Bearer " + token1))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andReturn()
                .getResponse()
                .getContentAsString();

        Long idActual = null;
        for (var sesion : json.readTree(respuesta)) {
            if (sesion.get("current").asBoolean()) {
                idActual = sesion.get("id").asLong();
            }
        }

        mockMvc.perform(delete("/api/v1/me/sessions/" + idActual)
                        .header("Authorization", "Bearer " + token1))
                .andExpect(status().isNoContent());

        // el token cerrado deja de valer, el otro sigue activo
        mockMvc.perform(get("/api/v1/auth/me").header("Authorization", "Bearer " + token1))
                .andExpect(status().isUnauthorized());
        mockMvc.perform(get("/api/v1/auth/me").header("Authorization", "Bearer " + token2))
                .andExpect(status().isOk());
    }
}
