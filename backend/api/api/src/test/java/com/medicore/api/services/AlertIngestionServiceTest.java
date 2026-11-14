package com.medicore.api.services;

import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import com.medicore.api.dto.IngestionResultResponse;
import com.medicore.api.models.RiskLevel;
import com.medicore.api.models.SeasonAlert;
import com.medicore.api.repositories.SeasonAlertRepository;
import com.medicore.api.sources.AlertSourceException;
import com.medicore.api.sources.ExternalAlert;
import com.medicore.api.sources.FakeAlertSource;
import com.medicore.api.sources.FakeSourcesConfiguration;

@SpringBootTest(properties = {
        "app.sources.weather.enabled=false",
        "app.sources.ins.enabled=false"
})
@ActiveProfiles("dev")
@Transactional
@Import(FakeSourcesConfiguration.class)
class AlertIngestionServiceTest {

    @Autowired
    private AlertIngestionService ingestionService;

    @Autowired
    private FakeAlertSource fuente;

    @Autowired
    private SeasonAlertRepository alertRepository;

    @BeforeEach
    void limpiar() {
        fuente.reiniciar();
    }

    private List<SeasonAlert> importadas() {
        return alertRepository.findByOrigin(FakeAlertSource.ID);
    }

    @Test
    @DisplayName("importa las alertas nuevas y guarda su procedencia")
    void importaNuevasConProcedencia() {
        fuente.devolverValidas();

        IngestionResultResponse resultado = ingestionService.sincronizar();

        assertEquals(1, resultado.fuentes());
        assertEquals(2, resultado.nuevas());
        assertEquals(0, resultado.fallidas());
        assertEquals(2, importadas().size());

        SeasonAlert alerta = importadas().get(0);
        assertEquals(FakeAlertSource.ID, alerta.getOrigin());
        assertNotNull(alerta.getExternalId());
        assertNotNull(alerta.getFetchedAt(), "guarda cuando se consulto la fuente");
        assertEquals("Fuente de prueba", alerta.getSource());
        assertTrue(alerta.isActive());
        assertEquals(RiskLevel.ALTO, alerta.getRiskLevel());
    }

    @Test
    @DisplayName("la misma alerta de la misma fuente se actualiza, no se duplica")
    void noDuplicaEntreCorridas() {
        fuente.devolverValidas();
        ingestionService.sincronizar();

        IngestionResultResponse segunda = ingestionService.sincronizar();

        assertEquals(0, segunda.nuevas());
        assertEquals(2, segunda.actualizadas());
        assertEquals(2, importadas().size());
    }

    @Test
    @DisplayName("los registros incompletos se descartan, no se publican")
    void descartaRegistrosInvalidos() {
        LocalDate hoy = LocalDate.now();
        fuente.devolver(List.of(
                new ExternalAlert("ok-1", "Alerta valida", "detalle", "Clima extremo",
                        RiskLevel.MEDIO, "Valledupar", "Cesar", "Fuente de prueba", hoy, hoy),
                new ExternalAlert("mal-1", null, "sin titulo", "Clima extremo",
                        RiskLevel.MEDIO, "Valledupar", "Cesar", "Fuente de prueba", hoy, hoy),
                new ExternalAlert("mal-2", "sin fecha", "detalle", "Clima extremo",
                        RiskLevel.MEDIO, "Valledupar", "Cesar", "Fuente de prueba", null, null)));

        IngestionResultResponse resultado = ingestionService.sincronizar();

        assertEquals(1, resultado.nuevas());
        assertEquals(2, resultado.descartadas());
        assertEquals(1, importadas().size());
    }

    @Test
    @DisplayName("una alerta vencida se guarda inactiva")
    void alertaVencidaQuedaInactiva() {
        LocalDate ayer = LocalDate.now().minusDays(3);
        fuente.devolver(List.of(
                new ExternalAlert("vieja-1", "Alerta vencida", "detalle", "Clima extremo",
                        RiskLevel.BAJO, "Valledupar", "Cesar", "Fuente de prueba", ayer, ayer)));

        ingestionService.sincronizar();

        assertFalse(importadas().get(0).isActive(), "no se publica como vigente");
    }

    @Test
    @DisplayName("si la fuente no responde se registra el error y no se inventan alertas")
    void falloDeFuenteRegistrado() {
        fuente.fallar(AlertSourceException.Motivo.NO_DISPONIBLE);

        IngestionResultResponse resultado = ingestionService.sincronizar();

        assertEquals(1, resultado.fallidas());
        assertEquals(0, resultado.nuevas());
        assertTrue(importadas().isEmpty(), "sin datos no hay alertas");

        var estado = ingestionService.estado();
        assertEquals(1, estado.size());
        assertEquals("ERROR", estado.get(0).status());
        assertNotNull(estado.get(0).errorMessage());
        assertNotNull(estado.get(0).finishedAt());
    }

    @Test
    @DisplayName("con datos invalidos la corrida tambien queda como error")
    void datosInvalidosRegistrados() {
        fuente.fallar(AlertSourceException.Motivo.DATOS_INVALIDOS);

        IngestionResultResponse resultado = ingestionService.sincronizar();

        assertEquals(1, resultado.fallidas());
        assertEquals("ERROR", ingestionService.estado().get(0).status());
    }

    @Test
    @DisplayName("antes de la primera corrida el estado es SIN_CORRIDAS")
    void estadoSinCorridas() {
        assertEquals("SIN_CORRIDAS", ingestionService.estado().get(0).status());
    }
}