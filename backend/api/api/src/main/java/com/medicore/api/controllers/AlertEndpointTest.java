package com.medicore.api.controllers;

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.everyItem;
import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.is;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import com.medicore.api.repositories.SeasonAlertRepository;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("dev")
@Transactional
class AlertEndpointTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private SeasonAlertRepository alertRepository;

    private Long idDeCualquierAlerta() {
        return alertRepository.findAll().get(0).getId();
    }

    @Test
    @DisplayName("las alertas se consultan sin token")
    void alertasPublicas() throws Exception {
        mockMvc.perform(get("/api/v1/alerts"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(14))
                .andExpect(jsonPath("$[0].title").isNotEmpty())
                .andExpect(jsonPath("$[0].riskLevel").isNotEmpty());
    }

    @Test
    @DisplayName("filtra por ciudad y region en la URL")
    void filtraPorCiudadYRegion() throws Exception {
        mockMvc.perform(get("/api/v1/alerts")
                        .param("city", "Valledupar")
                        .param("region", "Cesar"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[*].city", everyItem(is("Valledupar"))));
    }

    @Test
    @DisplayName("filtra por categoria y nivel de riesgo")
    void filtraPorCategoriaYRiesgo() throws Exception {
        mockMvc.perform(get("/api/v1/alerts")
                        .param("category", "Clima extremo")
                        .param("riskLevel", "alto"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].riskLevel").value("ALTO"))
                .andExpect(jsonPath("$[0].category").value("Clima extremo"));
    }

    @Test
    @DisplayName("filtra por estado inactivo")
    void filtraPorEstadoInactivo() throws Exception {
        mockMvc.perform(get("/api/v1/alerts").param("active", "false"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].active").value(false));
    }

    @Test
    @DisplayName("consulta el detalle de una alerta")
    void detalleDeAlerta() throws Exception {
        Long id = idDeCualquierAlerta();

        mockMvc.perform(get("/api/v1/alerts/" + id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(id))
                .andExpect(jsonPath("$.description").isNotEmpty())
                .andExpect(jsonPath("$.region").isNotEmpty());
    }

    @Test
    @DisplayName("una alerta inexistente responde 404")
    void alertaInexistente() throws Exception {
        mockMvc.perform(get("/api/v1/alerts/9999999"))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("un nivel de riesgo invalido responde 400 con el formato de error comun")
    void nivelDeRiesgoInvalido() throws Exception {
        mockMvc.perform(get("/api/v1/alerts").param("riskLevel", "extremo"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.mensaje", containsString("no es valido")));
    }

    @Test
    @DisplayName("los valores de los filtros salen de la base de datos")
    void filtrosDisponibles() throws Exception {
        mockMvc.perform(get("/api/v1/alerts/filters"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.riskLevels.length()").value(4))
                .andExpect(jsonPath("$.categories", hasItem("Clima extremo")))
                .andExpect(jsonPath("$.regions", hasItem("Cesar")))
                .andExpect(jsonPath("$.cities", hasItem("Valledupar")));
    }
}