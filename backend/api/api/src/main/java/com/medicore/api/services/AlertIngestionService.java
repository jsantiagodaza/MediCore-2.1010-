package com.medicore.api.services;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.medicore.api.dto.IngestionResultResponse;
import com.medicore.api.dto.SourceStatusResponse;
import com.medicore.api.models.AlertSourceRun;
import com.medicore.api.models.RiskLevel;
import com.medicore.api.models.SeasonAlert;
import com.medicore.api.repositories.AlertSourceRunRepository;
import com.medicore.api.repositories.SeasonAlertRepository;
import com.medicore.api.sources.AlertSource;
import com.medicore.api.sources.AlertSourceException;
import com.medicore.api.sources.ExternalAlert;

@Service
public class AlertIngestionService {

    private static final Logger log = LoggerFactory.getLogger(AlertIngestionService.class);

    private static final String CATEGORIA_POR_DEFECTO = "Vigilancia epidemiologica";

    private final List<AlertSource> fuentes;
    private final SeasonAlertRepository alertRepository;
    private final AlertSourceRunRepository runRepository;

    public AlertIngestionService(List<AlertSource> fuentes,
                                 SeasonAlertRepository alertRepository,
                                 AlertSourceRunRepository runRepository) {
        this.fuentes = fuentes == null ? List.of() : fuentes;
        this.alertRepository = alertRepository;
        this.runRepository = runRepository;
    }

    @Transactional
    public IngestionResultResponse sincronizar() {
        List<SourceStatusResponse> detalle = new ArrayList<>();
        int nuevas = 0;
        int actualizadas = 0;
        int descartadas = 0;
        int fallidas = 0;

        for (AlertSource fuente : fuentes) {
            AlertSourceRun corrida = new AlertSourceRun(fuente.id(), LocalDateTime.now());
            int importadas = 0;

            try {
                for (ExternalAlert externa : fuente.consultar()) {
                    if (!externa.esValida()) {
                        descartadas++;
                        continue;
                    }
                    boolean eraActualizacion = guardar(fuente, externa);
                    importadas++;
                    if (eraActualizacion) {
                        actualizadas++;
                    } else {
                        nuevas++;
                    }
                }
                corrida.terminarOk(importadas);
            } catch (AlertSourceException error) {
                fallidas++;
                corrida.terminarConError(error.getMotivo() + ": " + error.getMessage());
                log.warn("Fuente {} no disponible: {}", fuente.id(), error.getMessage());
            } catch (RuntimeException error) {
                fallidas++;
                corrida.terminarConError("Error inesperado al importar");
                log.error("Error inesperado importando de {}", fuente.id(), error);
            }

            runRepository.save(corrida);
            detalle.add(SourceStatusResponse.desde(fuente, corrida));
        }

        return new IngestionResultResponse(fuentes.size(), nuevas, actualizadas,
                descartadas, fallidas, detalle);
    }

    @Transactional(readOnly = true)
    public List<SourceStatusResponse> estado() {
        List<SourceStatusResponse> estados = new ArrayList<>();
        for (AlertSource fuente : fuentes) {
            Optional<AlertSourceRun> ultima =
                    runRepository.findTopBySourceIdOrderByStartedAtDesc(fuente.id());
            estados.add(ultima.map(corrida -> SourceStatusResponse.desde(fuente, corrida))
                    .orElseGet(() -> SourceStatusResponse.sinCorridas(fuente)));
        }
        return estados;
    }

    private boolean guardar(AlertSource fuente, ExternalAlert externa) {
        Optional<SeasonAlert> existente =
                alertRepository.findByOriginAndExternalId(fuente.id(), recortar(externa.externalId(), 160));

        boolean esNueva = existente.isEmpty();
        SeasonAlert alerta = existente.orElseGet(SeasonAlert::new);

        if (esNueva) {
            alerta.setCreatedAt(LocalDateTime.now());
        }

        alerta.setTitle(recortar(externa.title(), 160));
        alerta.setDescription(recortar(
                externa.description() == null || externa.description().isBlank()
                        ? "Informacion publicada por " + externa.source()
                        : externa.description(),
                2000));
        alerta.setCategory(recortar(
                externa.category() == null || externa.category().isBlank()
                        ? CATEGORIA_POR_DEFECTO
                        : externa.category(),
                80));
        alerta.setRiskLevel(externa.riskLevel() == null ? RiskLevel.MEDIO : externa.riskLevel());
        alerta.setCity(recortar(externa.city(), 120));
        alerta.setRegion(recortar(
                externa.region() == null || externa.region().isBlank() ? "Nacional" : externa.region(),
                120));
        alerta.setSource(recortar(
                externa.source() == null || externa.source().isBlank() ? fuente.nombre() : externa.source(),
                160));
        alerta.setOrigin(fuente.id());
        alerta.setExternalId(recortar(externa.externalId(), 160));
        alerta.setFetchedAt(LocalDateTime.now());
        alerta.setStartsOn(externa.startsOn());
        alerta.setEndsOn(externa.endsOn());
        alerta.setActive(externa.endsOn() == null || !externa.endsOn().isBefore(LocalDate.now()));

        alertRepository.save(alerta);
        return !esNueva;
    }

    private String recortar(String texto, int maximo) {
        if (texto == null) {
            return null;
        }
        String limpio = texto.trim();
        return limpio.length() <= maximo ? limpio : limpio.substring(0, maximo);
    }
}