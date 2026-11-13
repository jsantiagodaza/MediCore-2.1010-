package com.medicore.api.services;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Locale;
import java.util.Optional;

import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.medicore.api.dto.AlertFilterOptionsResponse;
import com.medicore.api.models.RiskLevel;
import com.medicore.api.models.SeasonAlert;
import com.medicore.api.repositories.SeasonAlertRepository;

import jakarta.persistence.criteria.Predicate;

@Service
@Transactional(readOnly = true)
public class AlertService {

    private static final int MAX_TEXTO = 120;

    private final SeasonAlertRepository alertRepository;

    public AlertService(SeasonAlertRepository alertRepository) {
        this.alertRepository = alertRepository;
    }

    public List<SeasonAlert> search(String city, String region, String category,
                                    String riskLevel, Boolean active) {

        String ciudad = textoOpcional(city, "La ciudad", MAX_TEXTO);
        String zona = textoOpcional(region, "La region", MAX_TEXTO);
        String categoria = validarCategoria(category);
        RiskLevel riesgo = (riskLevel == null || riskLevel.isBlank()) ? null : RiskLevel.from(riskLevel);

        Specification<SeasonAlert> filtros = (root, query, cb) -> {
            List<Predicate> condiciones = new ArrayList<>();

            if (ciudad != null) {
                condiciones.add(cb.equal(cb.lower(root.get("city")), ciudad.toLowerCase(Locale.ROOT)));
            }
            if (zona != null) {
                condiciones.add(cb.equal(cb.lower(root.get("region")), zona.toLowerCase(Locale.ROOT)));
            }
            if (categoria != null) {
                condiciones.add(cb.equal(cb.lower(root.get("category")), categoria.toLowerCase(Locale.ROOT)));
            }
            if (riesgo != null) {
                condiciones.add(cb.equal(root.get("riskLevel"), riesgo));
            }
            if (active != null) {
                condiciones.add(cb.equal(root.get("active"), active));
            }

            return cb.and(condiciones.toArray(new Predicate[0]));
        };

        return alertRepository.findAll(filtros, Sort.by(Sort.Direction.DESC, "startsOn"));
    }

    public Optional<SeasonAlert> getById(Long id) {
        if (id == null || id <= 0) {
            throw new IllegalArgumentException("El id de la alerta debe ser un numero positivo");
        }
        return alertRepository.findById(id);
    }

    public AlertFilterOptionsResponse getFilterOptions() {
        List<String> niveles = Arrays.stream(RiskLevel.values())
                .map(Enum::name)
                .toList();

        return new AlertFilterOptionsResponse(
                alertRepository.findDistinctCategories(),
                niveles,
                alertRepository.findDistinctRegions(),
                alertRepository.findDistinctCities());
    }

    private String textoOpcional(String valor, String etiqueta, int maximo) {
        if (valor == null || valor.isBlank()) {
            return null;
        }
        String limpio = valor.trim();
        if (limpio.length() > maximo) {
            throw new IllegalArgumentException(
                    etiqueta + " no puede superar " + maximo + " caracteres");
        }
        return limpio;
    }

    private String validarCategoria(String category) {
        String solicitada = textoOpcional(category, "La categoria", 80);
        if (solicitada == null) {
            return null;
        }
        return alertRepository.findDistinctCategories().stream()
                .filter(c -> c.equalsIgnoreCase(solicitada))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException(
                        "La categoria '" + solicitada + "' no existe en las alertas de temporada"));
    }
}