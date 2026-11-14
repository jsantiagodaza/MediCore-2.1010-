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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.medicore.api.assistant.FakeAssistantConfiguration;
import com.medicore.api.dto.LoginRequest;
import com.medicore.api.services.AuthService;

@SpringBootTest(properties = {
        "app.assistant.enabled=true",
        "app.assistant.provider=fake",
        "app.assistant.model=modelo-prueba"
})
@AutoConfigureMockMvc
@ActiveProfiles("dev")
@Import(FakeAssistantConfiguration.class)
class AssistantContractEndpointTest {

    private static final String URL = "/api/v1/assistant/messages";
    private static final String PASSWORD = "Contrasena123";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper json;

    @Autowired
    private AuthService authService;

    private String token() throws Exception {
        authService.register("contrato-asistente@medicore.com", PASSWORD, "Prueba");

        String respuesta = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(
                                new LoginRequest("contrato-asistente@medicore.com", PASSWORD))))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        return json.readTree(respuesta).get("token").asText();
    }

    @Test
    @DisplayName("la ruta exige sesion")
    void exigeToken() throws Exception {
        mockMvc.perform(post(URL)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"message\":\"hola\"}"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("la respuesta trae los campos acordados con el frontend")
    void contratoConFrontend() throws Exception {
        String token = token();

        mockMvc.perform(post(URL)
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"message\":\"cual es la capital de francia\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.reply").isNotEmpty())
                .andExpect(jsonPath("$.disclaimer").isNotEmpty())
                .andExpect(jsonPath("$.suggested_actions").isArray())
                .andExpect(jsonPath("$.respuesta").isNotEmpty())
                .andExpect(jsonPath("$.intent").isNotEmpty())
                .andExpect(jsonPath("$.origen").value("MODELO"))
                .andExpect(jsonPath("$.modelo").value("modelo-prueba"))
                .andExpect(jsonPath("$.timestamp").isNotEmpty());
    }
}