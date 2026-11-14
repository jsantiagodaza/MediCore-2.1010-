package com.medicore.api.controllers;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import org.springframework.transaction.annotation.Transactional;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.medicore.api.dto.LoginRequest;
import com.medicore.api.services.AuthService;
import com.medicore.api.sources.FakeAlertSource;
import com.medicore.api.sources.FakeSourcesConfiguration;

@SpringBootTest(properties = {
        "app.sources.weather.enabled=false",
        "app.sources.ins.enabled=false"
})
@AutoConfigureMockMvc
@ActiveProfiles("dev")
@Transactional
@Import(FakeSourcesConfiguration.class)
class AlertSourceEndpointTest {

    private static final String URL = "/api/v1/alert-sources";
    private static final String PASSWORD = "Contrasena123";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper json;

    @Autowired
    private AuthService authService;

    @Autowired
    private FakeAlertSource fuente;

    private String tokenDe(String email) throws Exception {
        authService.register(email, PASSWORD, "Prueba");

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
    @DisplayName("las fuentes exigen sesion")
    void exigeToken() throws Exception {
        mockMvc.perform(get(URL)).andExpect(status().isUnauthorized());
        mockMvc.perform(post(URL + "/refresh")).andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("sincroniza y devuelve el resumen")
    void sincroniza() throws Exception {
        String token = tokenDe("fuentes-sync@medicore.com");
        fuente.devolverValidas();

        mockMvc.perform(post(URL + "/refresh")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.fuentes").value(1))
                .andExpect(jsonPath("$.nuevas").value(2))
                .andExpect(jsonPath("$.fallidas").value(0))
                .andExpect(jsonPath("$.detalle[0].sourceId").value("fake"));

        mockMvc.perform(get(URL)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].sourceId").value("fake"))
                .andExpect(jsonPath("$[0].status").value("OK"))
                .andExpect(jsonPath("$[0].alertsImported").value(2));
    }
}