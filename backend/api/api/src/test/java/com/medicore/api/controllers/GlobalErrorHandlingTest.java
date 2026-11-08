package com.medicore.api.controllers;

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.not;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.Map;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Manejo global de errores: formato JSON uniforme y sin filtrar informacion
 * interna (stack traces, nombres de clases, mensajes tecnicos).
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("dev")
@Import(GlobalErrorHandlingTest.ControladorQueFalla.class)
class GlobalErrorHandlingTest {

    private static final String DETALLE_SENSIBLE = "detalle-sensible-que-no-debe-salir";

    @Autowired
    private MockMvc mockMvc;

    // ------------------------------------------------------------------
    //  500 - error no controlado
    // ------------------------------------------------------------------

    @Test
    @DisplayName("una excepcion no controlada devuelve 500 con mensaje generico y sin detalles")
    void errorInternoNoFiltraInformacion() throws Exception {
        mockMvc.perform(get("/test/explota"))
                .andExpect(status().isInternalServerError())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.status").value(500))
                .andExpect(jsonPath("$.error").value("Error interno"))
                .andExpect(jsonPath("$.path").value("/test/explota"))
                .andExpect(jsonPath("$.timestamp").isNotEmpty())
                .andExpect(jsonPath("$.mensaje").value(
                        "Ocurrio un error inesperado. Intenta de nuevo o contacta al administrador"))
                // ni el mensaje interno, ni la clase, ni el stack trace
                .andExpect(content().string(not(containsString(DETALLE_SENSIBLE))))
                .andExpect(content().string(not(containsString("IllegalStateException"))))
                .andExpect(content().string(not(containsString("java."))))
                .andExpect(content().string(not(containsString("at com.medicore"))));
    }

    // ------------------------------------------------------------------
    //  400 - peticiones mal formadas
    // ------------------------------------------------------------------

    @Test
    @DisplayName("un JSON mal formado devuelve 400 con JSON uniforme")
    void jsonMalFormado() throws Exception {
        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("esto-no-es-json"))
                .andExpect(status().isBadRequest())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.error").value("Cuerpo invalido"))
                .andExpect(jsonPath("$.path").value("/api/v1/auth/login"));
    }

    @Test
    @DisplayName("un parametro con tipo incorrecto devuelve 400 sin repetir el valor")
    void tipoIncorrectoEnParametro() throws Exception {
        mockMvc.perform(get("/api/v1/medicines/abc"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.error").value("Parametro invalido"))
                .andExpect(jsonPath("$.mensaje").value(containsString("'id'")));
    }

    @Test
    @DisplayName("una categoria inexistente devuelve 400 con el mensaje del servicio")
    void categoriaInvalida() throws Exception {
        mockMvc.perform(get("/api/v1/medicines").param("category", "NoExiste"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Solicitud invalida"))
                .andExpect(jsonPath("$.mensaje").value(containsString("no existe")));
    }

    @Test
    @DisplayName("un body invalido en el registro devuelve 400 con el primer error")
    void bodyInvalidoEnRegistro() throws Exception {
        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"sin-arroba\",\"password\":\"123\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.error").value("Datos invalidos"));
    }

    // ------------------------------------------------------------------
    //  401 / 404 / 405
    // ------------------------------------------------------------------

    @Test
    @DisplayName("una ruta privada sin token devuelve 401 con JSON uniforme")
    void sinToken() throws Exception {
        mockMvc.perform(get("/api/v1/auth/me"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401))
                .andExpect(jsonPath("$.error").value("No autorizado"))
                .andExpect(jsonPath("$.path").value("/api/v1/auth/me"))
                // no debe filtrar nada tecnico
                .andExpect(content().string(not(containsString("Exception"))))
                .andExpect(content().string(not(containsString("at com.medicore"))));
    }

    @Test
    @DisplayName("una ruta inexistente devuelve 404 en JSON, no la pagina de error de Spring")
    void rutaInexistente() throws Exception {
        mockMvc.perform(get("/api/v1/health/noexiste"))
                .andExpect(status().isNotFound())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.status").value(404))
                .andExpect(jsonPath("$.error").value("No encontrado"))
                .andExpect(jsonPath("$.path").value("/api/v1/health/noexiste"));
    }

    @Test
    @DisplayName("un metodo no permitido devuelve 405 en JSON")
    void metodoNoPermitido() throws Exception {
        mockMvc.perform(post("/api/v1/health"))
                .andExpect(status().isMethodNotAllowed())
                .andExpect(jsonPath("$.status").value(405))
                .andExpect(jsonPath("$.error").value("Metodo no permitido"));
    }

    // ------------------------------------------------------------------

    /** Endpoint que solo existe en las pruebas, para comprobar el 500. */
    @RestController
    static class ControladorExplosivo {

        @GetMapping("/test/explota")
        public Map<String, String> explota() {
            throw new IllegalStateException(DETALLE_SENSIBLE);
        }
    }

    @TestConfiguration
    static class ControladorQueFalla {

        @Bean
        ControladorExplosivo controladorExplosivo() {
            return new ControladorExplosivo();
        }
    }
}
