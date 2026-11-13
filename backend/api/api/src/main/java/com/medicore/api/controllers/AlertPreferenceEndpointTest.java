package com.medicore.api.controllers;

import static org.hamcrest.Matchers.containsString;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

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
import com.medicore.api.dto.AlertPreferenceRequest;
import com.medicore.api.dto.LoginRequest;
import com.medicore.api.services.AuthService;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("dev")
@Transactional
class AlertPreferenceEndpointTest {

    private static final String PASSWORD = "Contrasena123";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper json;

    @Autowired
    private AuthService authService;

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

    private String cuerpo(String ciudad, String region, String categoria,
                          String riesgo, Boolean activa) throws Exception {
        return json.writeValueAsString(
                new AlertPreferenceRequest(ciudad, region, categoria, riesgo, activa));
    }

    @Test
    @DisplayName("la ruta de preferencias exige token")
    void exigeToken() throws Exception {
        mockMvc.perform(get("/api/v1/me/alert-preferences")).andExpect(status().isUnauthorized());
        mockMvc.perform(put("/api/v1/me/alert-preferences")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(cuerpo("Valledupar", "Cesar", null, "alto", true)))
                .andExpect(status().isUnauthorized());
        mockMvc.perform(delete("/api/v1/me/alert-preferences")).andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("un usuario no ve las preferencias de otro")
    void aislamientoEntreUsuarios() throws Exception {
        String tokenA = tokenDe("preferencias-a@medicore.com");
        String tokenB = tokenDe("preferencias-b@medicore.com");

        mockMvc.perform(put("/api/v1/me/alert-preferences")
                        .header("Authorization", "Bearer " + tokenA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(cuerpo("Valledupar", "Cesar", null, "alto", true)))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/v1/me/alert-preferences")
                        .header("Authorization", "Bearer " + tokenB))
                .andExpect(status().isNotFound());

        mockMvc.perform(put("/api/v1/me/alert-preferences")
                        .header("Authorization", "Bearer " + tokenB)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(cuerpo("Aguachica", "Cesar", null, "bajo", true)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.city").value("Aguachica"));

        mockMvc.perform(get("/api/v1/me/alert-preferences")
                        .header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.city").value("Valledupar"))
                .andExpect(jsonPath("$.riskLevel").value("ALTO"));
    }

    @Test
    @DisplayName("guarda y luego consulta las preferencias")
    void guardaYConsulta() throws Exception {
        String token = tokenDe("preferencias-guarda@medicore.com");

        mockMvc.perform(put("/api/v1/me/alert-preferences")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(cuerpo("Valledupar", "Cesar", "Clima extremo", "alto", true)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").isNotEmpty())
                .andExpect(jsonPath("$.city").value("Valledupar"))
                .andExpect(jsonPath("$.region").value("Cesar"))
                .andExpect(jsonPath("$.category").value("Clima extremo"))
                .andExpect(jsonPath("$.riskLevel").value("ALTO"))
                .andExpect(jsonPath("$.enabled").value(true));

        mockMvc.perform(get("/api/v1/me/alert-preferences")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.city").value("Valledupar"))
                .andExpect(jsonPath("$.riskLevel").value("ALTO"));
    }

    @Test
    @DisplayName("guardar dos veces actualiza la misma preferencia")
    void guardarEsUpsert() throws Exception {
        String token = tokenDe("preferencias-upsert@medicore.com");

        mockMvc.perform(put("/api/v1/me/alert-preferences")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(cuerpo("Valledupar", "Cesar", null, "bajo", true)))
                .andExpect(status().isOk());

        mockMvc.perform(put("/api/v1/me/alert-preferences")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(cuerpo("Aguachica", "Cesar", null, "critico", false)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.city").value("Aguachica"))
                .andExpect(jsonPath("$.riskLevel").value("CRITICO"))
                .andExpect(jsonPath("$.enabled").value(false));

        mockMvc.perform(get("/api/v1/me/alert-preferences")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.city").value("Aguachica"))
                .andExpect(jsonPath("$.enabled").value(false));
    }

    @Test
    @DisplayName("borra las preferencias del usuario")
    void borrar() throws Exception {
        String token = tokenDe("preferencias-borra@medicore.com");

        mockMvc.perform(put("/api/v1/me/alert-preferences")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(cuerpo(null, "Cesar", null, "medio", true)))
                .andExpect(status().isOk());

        mockMvc.perform(delete("/api/v1/me/alert-preferences")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/v1/me/alert-preferences")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isNotFound());

        mockMvc.perform(delete("/api/v1/me/alert-preferences")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isNoContent());
    }

    @Test
    @DisplayName("rechaza un nivel de riesgo invalido")
    void rechazaNivelInvalido() throws Exception {
        String token = tokenDe("preferencias-riesgo@medicore.com");

        mockMvc.perform(put("/api/v1/me/alert-preferences")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(cuerpo("Valledupar", "Cesar", null, "extremo", true)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.mensaje", containsString("no es valido")));
    }

    @Test
    @DisplayName("rechaza una ciudad demasiado larga")
    void rechazaCiudadLarga() throws Exception {
        String token = tokenDe("preferencias-ciudad@medicore.com");

        mockMvc.perform(put("/api/v1/me/alert-preferences")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(cuerpo("a".repeat(121), "Cesar", null, "alto", true)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.mensaje", containsString("120")));
    }

    @Test
    @DisplayName("rechaza la peticion sin nivel de riesgo")
    void rechazaSinNivel() throws Exception {
        String token = tokenDe("preferencias-sinnivel@medicore.com");

        mockMvc.perform(put("/api/v1/me/alert-preferences")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"city\":\"Valledupar\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.mensaje", containsString("obligatorio")));
    }

    @Test
    @DisplayName("acepta el nivel de riesgo con tildes y lo normaliza")
    void aceptaNivelConTildes() throws Exception {
        String token = tokenDe("preferencias-tildes@medicore.com");

        mockMvc.perform(put("/api/v1/me/alert-preferences")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(cuerpo(null, "Cesar", null, "Cr\u00edtico", true)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.riskLevel").value("CRITICO"));
    }
}