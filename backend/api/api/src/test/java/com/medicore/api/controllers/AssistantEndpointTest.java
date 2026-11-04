package com.medicore.api.controllers;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.BeforeEach;
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
import com.medicore.api.services.AuthService;

/**
 * Endpoint POST /api/v1/assistant/messages: JSON valido, respuesta
 * estructurada, ruta privada y manejo de solicitudes incorrectas.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("dev")
@Transactional
class AssistantEndpointTest {

    private static final String PASSWORD = "Contrasena123";
    private static final String URL = "/api/v1/assistant/messages";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper json;

    @Autowired
    private AuthService authService;

    private String token;

    @BeforeEach
    void iniciarSesion() throws Exception {
        authService.register("asistente@medicore.com", PASSWORD, "Asistente");

        String respuesta = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(
                                new LoginRequest("asistente@medicore.com", PASSWORD))))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        token = json.readTree(respuesta).get("token").asText();
    }

    private String cuerpo(String mensaje) throws Exception {
        return json.writeValueAsString(new com.medicore.api.dto.AssistantMessageRequest(mensaje));
    }

    // ------------------------------------------------------------------

    @Test
    @DisplayName("sin token la ruta es privada (401)")
    void sinToken() throws Exception {
        mockMvc.perform(post(URL)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(cuerpo("hola")))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error").value("No autorizado"));
    }

    @Test
    @DisplayName("con JSON valido devuelve 200 y una respuesta estructurada")
    void respuestaEstructurada() throws Exception {
        mockMvc.perform(post(URL)
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(cuerpo("¿Para qué sirve el ibuprofeno?")))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.id").isNotEmpty())
                .andExpect(jsonPath("$.respuesta").isNotEmpty())
                .andExpect(jsonPath("$.intent").value("MEDICAMENTO"))
                .andExpect(jsonPath("$.confianza").isNumber())
                .andExpect(jsonPath("$.emergencia").value(false))
                .andExpect(jsonPath("$.sugerencias").isArray())
                .andExpect(jsonPath("$.fuentes").isArray())
                .andExpect(jsonPath("$.datos.nombre").value("Ibuprofeno"))
                .andExpect(jsonPath("$.timestamp").isNotEmpty());
    }

    @Test
    @DisplayName("una urgencia responde 200 con emergencia=true")
    void urgencia() throws Exception {
        mockMvc.perform(post(URL)
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(cuerpo("no puedo respirar")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.intent").value("EMERGENCIA"))
                .andExpect(jsonPath("$.emergencia").value(true));
    }

    // ------------------------------------------------------------------
    //  Solicitudes incorrectas -> 400 con JSON uniforme
    // ------------------------------------------------------------------

    @Test
    @DisplayName("un mensaje vacio devuelve 400")
    void mensajeVacio() throws Exception {
        mockMvc.perform(post(URL)
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(cuerpo("   ")))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.error").value("Datos invalidos"))
                .andExpect(jsonPath("$.path").value(URL));
    }

    @Test
    @DisplayName("un mensaje demasiado largo devuelve 400")
    void mensajeDemasiadoLargo() throws Exception {
        mockMvc.perform(post(URL)
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(cuerpo("a".repeat(501))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.mensaje").value("El mensaje no puede superar 500 caracteres"));
    }

    @Test
    @DisplayName("falta el campo message: devuelve 400")
    void faltaElCampo() throws Exception {
        mockMvc.perform(post(URL)
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"otro\":\"valor\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400));
    }

    @Test
    @DisplayName("un JSON mal formado devuelve 400")
    void jsonMalFormado() throws Exception {
        mockMvc.perform(post(URL)
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("no es json"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Cuerpo invalido"));
    }

    @Test
    @DisplayName("un metodo no permitido devuelve 405")
    void metodoNoPermitido() throws Exception {
        mockMvc.perform(get(URL).header("Authorization", "Bearer " + token))
                .andExpect(status().isMethodNotAllowed())
                .andExpect(jsonPath("$.error").value("Metodo no permitido"));
    }
}
