package com.medicore.api.services;

import java.time.LocalDateTime;
import java.util.Optional;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.medicore.api.dto.AlertPreferenceRequest;
import com.medicore.api.models.AlertPreference;
import com.medicore.api.models.RiskLevel;
import com.medicore.api.models.User;
import com.medicore.api.repositories.AlertPreferenceRepository;

@Service
@Transactional
public class AlertPreferenceService {

    private static final int MAX_CIUDAD = 120;
    private static final int MAX_REGION = 120;
    private static final int MAX_CATEGORIA = 80;

    private final AlertPreferenceRepository preferenceRepository;

    public AlertPreferenceService(AlertPreferenceRepository preferenceRepository) {
        this.preferenceRepository = preferenceRepository;
    }

    @Transactional(readOnly = true)
    public Optional<AlertPreference> get(User usuario) {
        return preferenceRepository.findByUser(usuario);
    }

    public AlertPreference save(User usuario, AlertPreferenceRequest peticion) {
        RiskLevel riesgo = RiskLevel.from(peticion.getRiskLevel());
        String ciudad = textoOpcional(peticion.getCity(), "La ciudad", MAX_CIUDAD);
        String region = textoOpcional(peticion.getRegion(), "La region", MAX_REGION);
        String categoria = textoOpcional(peticion.getCategory(), "La categoria", MAX_CATEGORIA);
        boolean activa = peticion.getEnabled() == null || peticion.getEnabled();

        AlertPreference preferencia = preferenceRepository.findByUser(usuario)
                .orElseGet(() -> new AlertPreference(usuario, riesgo, LocalDateTime.now()));

        preferencia.setCity(ciudad);
        preferencia.setRegion(region);
        preferencia.setCategory(categoria);
        preferencia.setRiskLevel(riesgo);
        preferencia.setEnabled(activa);
        preferencia.setUpdatedAt(LocalDateTime.now());

        return preferenceRepository.save(preferencia);
    }

    public void delete(User usuario) {
        preferenceRepository.findByUser(usuario).ifPresent(preferenceRepository::delete);
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
}