package com.medicore.api.config;

import static org.hamcrest.Matchers.containsString;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpHeaders;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

/**
 * CORS: solo debe permitirse el origen del frontend en desarrollo.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("dev")
class CorsConfigTest {

    private static final String ORIGEN_PERMITIDO = "http://localhost:5173";
    private static final String ORIGEN_AJENO = "http://sitio-malicioso.example";

    @Autowired
    private MockMvc mockMvc;

    @Test
    @DisplayName("el preflight desde el origen permitido responde con sus cabeceras CORS")
    void preflightOrigenPermitido() throws Exception {
        mockMvc.perform(options("/api/v1/auth/login")
                        .header(HttpHeaders.ORIGIN, ORIGEN_PERMITIDO)
                        .header(HttpHeaders.ACCESS_CONTROL_REQUEST_METHOD, "POST")
                        .header(HttpHeaders.ACCESS_CONTROL_REQUEST_HEADERS, "content-type"))
                .andExpect(status().isOk())
                .andExpect(header().string(HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN, ORIGEN_PERMITIDO))
                .andExpect(header().string(HttpHeaders.ACCESS_CONTROL_ALLOW_METHODS,
                        containsString("POST")));
    }

    @Test
    @DisplayName("el preflight desde un origen ajeno se rechaza")
    void preflightOrigenAjeno() throws Exception {
        mockMvc.perform(options("/api/v1/auth/login")
                        .header(HttpHeaders.ORIGIN, ORIGEN_AJENO)
                        .header(HttpHeaders.ACCESS_CONTROL_REQUEST_METHOD, "POST"))
                .andExpect(status().isForbidden())
                .andExpect(header().doesNotExist(HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN));
    }

    @Test
    @DisplayName("una peticion normal del frontend lleva la cabecera CORS")
    void peticionNormalOrigenPermitido() throws Exception {
        mockMvc.perform(get("/api/v1/medicines")
                        .header(HttpHeaders.ORIGIN, ORIGEN_PERMITIDO))
                .andExpect(status().isOk())
                .andExpect(header().string(HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN, ORIGEN_PERMITIDO));
    }

    @Test
    @DisplayName("un origen ajeno no recibe cabecera CORS")
    void peticionNormalOrigenAjeno() throws Exception {
        mockMvc.perform(get("/api/v1/medicines")
                        .header(HttpHeaders.ORIGIN, ORIGEN_AJENO))
                .andExpect(header().doesNotExist(HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN));
    }

    @Test
    @DisplayName("el preflight de una ruta privada no exige token")
    void preflightRutaPrivada() throws Exception {
        mockMvc.perform(options("/api/v1/me/sessions")
                        .header(HttpHeaders.ORIGIN, ORIGEN_PERMITIDO)
                        .header(HttpHeaders.ACCESS_CONTROL_REQUEST_METHOD, "GET")
                        .header(HttpHeaders.ACCESS_CONTROL_REQUEST_HEADERS, "authorization"))
                .andExpect(status().isOk())
                .andExpect(header().string(HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN, ORIGEN_PERMITIDO));
    }
}
