package com.medicore.api.controllers;

import static org.hamcrest.Matchers.greaterThan;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.medicore.api.dto.AlertPreferenceRequest;
import com.medicore.api.dto.LoginRequest;
import com.medicore.api.mail.FakeEmailSender;
import com.medicore.api.mail.FakeMailConfiguration;
import com.medicore.api.models.User;
import com.medicore.api.services.AlertPreferenceService;
import com.medicore.api.services.AuthService;

@SpringBootTest(properties = {
        "app.mail.enabled=true",
        "app.mail.provider=fake",
        "app.mail.max-attempts=2",
        "app.mail.retry-delay-ms=0"
})
@AutoConfigureMockMvc
@ActiveProfiles("dev")
@Transactional
@Import(FakeMailConfiguration.class)
class AlertNotificationEndpointTest {

    private static final String PASSWORD = "Contrasena123";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper json;

    @Autowired
    private AuthService authService;

    @Autowired
    private AlertPreferenceService preferenceService;

    @Autowired
    private FakeEmailSender fakeEmailSender;

    @BeforeEach
    void limpiarBandeja() {
        fakeEmailSender.reiniciar();
    }

    private User registrar(String email) {
        return authService.register(email, PASSWORD, "Prueba");
    }

    private String tokenDe(String email) throws Exception {
        String respuesta = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(new LoginRequest(email, PASSWORD))))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        return json.readTree(respuesta).get("token").asText();
    }

    @Test
    @DisplayName("la ruta de notificaciones exige token")
    void exigeToken() throws Exception {
        mockMvc.perform(post("/api/v1/me/alert-notifications"))
                .andExpect(status().isUnauthorized());
        mockMvc.perform(get("/api/v1/me/alert-notifications"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("sin preferencias responde 200 con cero envios")
    void sinPreferencias() throws Exception {
        registrar("notif-sin-prefs@medicore.com");
        String token = tokenDe("notif-sin-prefs@medicore.com");

        mockMvc.perform(post("/api/v1/me/alert-notifications")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.enviados").value(0))
                .andExpect(jsonPath("$.mensaje").isNotEmpty());
    }

    @Test
    @DisplayName("envia y deja el historial consultable")
    void enviaYRegistra() throws Exception {
        User usuario = registrar("notif-envia@medicore.com");
        preferenceService.save(usuario,
                new AlertPreferenceRequest(null, "Cesar", null, "BAJO", true));

        String token = tokenDe("notif-envia@medicore.com");

        mockMvc.perform(post("/api/v1/me/alert-notifications")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.enviados").value(greaterThan(0)))
                .andExpect(jsonPath("$.fallidos").value(0));

        mockMvc.perform(get("/api/v1/me/alert-notifications")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(greaterThan(0)))
                .andExpect(jsonPath("$[0].status").value("ENVIADO"))
                .andExpect(jsonPath("$[0].recipient").value("notif-envia@medicore.com"))
                .andExpect(jsonPath("$[0].alertTitle").isNotEmpty());
    }

    @Test
    @DisplayName("el historial de un usuario no muestra envios de otro")
    void historialAislado() throws Exception {
        User emisor = registrar("notif-a@medicore.com");
        preferenceService.save(emisor, new AlertPreferenceRequest(null, "Cesar", null, "BAJO", true));
        String tokenA = tokenDe("notif-a@medicore.com");

        mockMvc.perform(post("/api/v1/me/alert-notifications")
                        .header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.enviados").value(greaterThan(0)));

        registrar("notif-b@medicore.com");
        String tokenB = tokenDe("notif-b@medicore.com");

        mockMvc.perform(get("/api/v1/me/alert-notifications")
                        .header("Authorization", "Bearer " + tokenB))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(0));
    }
}