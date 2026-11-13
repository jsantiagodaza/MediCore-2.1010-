package com.medicore.api.services;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.List;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import com.medicore.api.dto.AlertFilterOptionsResponse;
import com.medicore.api.models.RiskLevel;
import com.medicore.api.models.SeasonAlert;

@SpringBootTest
@ActiveProfiles("dev")
class AlertServiceTest {

    @Autowired
    private AlertService alertService;

    @Test
    @DisplayName("sin filtros devuelve todas las alertas persistidas")
    void devuelveTodasLasAlertas() {
        List<SeasonAlert> todas = alertService.search(null, null, null, null, null);

        assertFalse(todas.isEmpty(), "Flyway debe haber cargado las alertas de V5");
        assertEquals(14, todas.size());
    }

    @Test
    @DisplayName("filtra por ciudad")
    void filtraPorCiudad() {
        List<SeasonAlert> resultado = alertService.search("Valledupar", null, null, null, null);

        assertFalse(resultado.isEmpty());
        assertTrue(resultado.stream().allMatch(a -> "Valledupar".equalsIgnoreCase(a.getCity())));
    }

    @Test
    @DisplayName("filtra por region")
    void filtraPorRegion() {
        List<SeasonAlert> resultado = alertService.search(null, "Cesar", null, null, null);

        assertFalse(resultado.isEmpty());
        assertTrue(resultado.stream().allMatch(a -> "Cesar".equalsIgnoreCase(a.getRegion())));
    }

    @Test
    @DisplayName("filtra por categoria")
    void filtraPorCategoria() {
        List<SeasonAlert> resultado = alertService.search(null, null, "Clima extremo", null, null);

        assertFalse(resultado.isEmpty());
        assertTrue(resultado.stream().allMatch(a -> "Clima extremo".equals(a.getCategory())));
    }

    @Test
    @DisplayName("filtra por nivel de riesgo, sin importar mayusculas")
    void filtraPorNivelDeRiesgo() {
        List<SeasonAlert> resultado = alertService.search(null, null, null, "alto", null);

        assertFalse(resultado.isEmpty());
        assertTrue(resultado.stream().allMatch(a -> a.getRiskLevel() == RiskLevel.ALTO));
    }

    @Test
    @DisplayName("acepta el nivel de riesgo con tildes")
    void aceptaNivelConTildes() {
        List<SeasonAlert> resultado = alertService.search(null, null, null, "Cr\u00edtico", null);

        assertFalse(resultado.isEmpty(), "debe encontrar las alertas de nivel CRITICO");
        assertTrue(resultado.stream().allMatch(a -> a.getRiskLevel() == RiskLevel.CRITICO));
    }

    @Test
    @DisplayName("combina ciudad, categoria y nivel de riesgo")
    void combinaFiltros() {
        List<SeasonAlert> resultado = alertService.search(
                "Valledupar", "Cesar", "Clima extremo", "alto", null);

        assertFalse(resultado.isEmpty());
        assertTrue(resultado.stream().allMatch(a ->
                "Valledupar".equalsIgnoreCase(a.getCity())
                        && "Clima extremo".equals(a.getCategory())
                        && a.getRiskLevel() == RiskLevel.ALTO));
    }

    @Test
    @DisplayName("filtra por estado: solo inactivas")
    void filtraPorEstadoInactivo() {
        List<SeasonAlert> resultado = alertService.search(null, null, null, null, false);

        assertEquals(1, resultado.size());
        assertFalse(resultado.get(0).isActive());
    }

    @Test
    @DisplayName("una ciudad sin alertas devuelve lista vacia, no error")
    void ciudadSinResultados() {
        assertTrue(alertService.search("CiudadInventada", null, null, null, null).isEmpty());
    }

    @Test
    @DisplayName("un nivel de riesgo inexistente lanza IllegalArgumentException")
    void nivelDeRiesgoInvalido() {
        IllegalArgumentException error = assertThrows(IllegalArgumentException.class,
                () -> alertService.search(null, null, null, "extremo", null));

        assertTrue(error.getMessage().contains("no es valido"));
    }

    @Test
    @DisplayName("una categoria inexistente lanza IllegalArgumentException")
    void categoriaInexistente() {
        IllegalArgumentException error = assertThrows(IllegalArgumentException.class,
                () -> alertService.search(null, null, "CategoriaFantasma", null, null));

        assertTrue(error.getMessage().contains("no existe"));
    }

    @Test
    @DisplayName("un texto de filtro demasiado largo se rechaza")
    void textoDemasiadoLargo() {
        String larga = "a".repeat(121);

        assertThrows(IllegalArgumentException.class,
                () -> alertService.search(larga, null, null, null, null));
    }

    @Test
    @DisplayName("getById valida el id")
    void getByIdValidaId() {
        assertThrows(IllegalArgumentException.class, () -> alertService.getById(0L));
        assertThrows(IllegalArgumentException.class, () -> alertService.getById(null));
    }

    @Test
    @DisplayName("getById devuelve la alerta existente")
    void getByIdExistente() {
        Long id = alertService.search(null, null, null, null, null).get(0).getId();

        assertTrue(alertService.getById(id).isPresent());
    }

    @Test
    @DisplayName("getById inexistente devuelve Optional vacio")
    void getByIdInexistente() {
        assertTrue(alertService.getById(9_999_999L).isEmpty());
    }

    @Test
    @DisplayName("los filtros disponibles salen de la base de datos")
    void filtrosDisponibles() {
        AlertFilterOptionsResponse filtros = alertService.getFilterOptions();

        assertNotNull(filtros);
        assertFalse(filtros.categories().isEmpty());
        assertTrue(filtros.categories().contains("Clima extremo"));
        assertEquals(4, filtros.riskLevels().size());
        assertTrue(filtros.riskLevels().contains("CRITICO"));
        assertTrue(filtros.regions().contains("Cesar"));
        assertTrue(filtros.cities().contains("Valledupar"));
    }
}