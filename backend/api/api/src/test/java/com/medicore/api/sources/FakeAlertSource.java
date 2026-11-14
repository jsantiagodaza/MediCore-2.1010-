package com.medicore.api.sources;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

import com.medicore.api.models.RiskLevel;

public class FakeAlertSource implements AlertSource {

    public static final String ID = "fake";

    private List<ExternalAlert> alertas = new ArrayList<>();
    private AlertSourceException.Motivo fallo;

    @Override
    public String id() {
        return ID;
    }

    @Override
    public String nombre() {
        return "Fuente de prueba";
    }

    @Override
    public List<ExternalAlert> consultar() {
        if (fallo != null) {
            throw new AlertSourceException(fallo, "fallo simulado de la fuente");
        }
        return List.copyOf(alertas);
    }

    public void devolver(List<ExternalAlert> nuevas) {
        this.alertas = new ArrayList<>(nuevas);
    }

    public void devolverValidas() {
        LocalDate hoy = LocalDate.now();
        devolver(List.of(
                new ExternalAlert("fake-1", "Dengue en aumento", "Casos reportados en el municipio",
                        "Enfermedad transmitida por vectores", RiskLevel.ALTO,
                        "Valledupar", "Cesar", "Fuente de prueba", hoy, hoy.plusDays(10)),
                new ExternalAlert("fake-2", "Calor extremo previsto", "Temperatura sobre el umbral",
                        "Clima extremo", RiskLevel.MEDIO,
                        null, "Cesar", "Fuente de prueba", hoy, hoy.plusDays(2))));
    }

    public void fallar(AlertSourceException.Motivo motivo) {
        this.fallo = motivo;
    }

    public void reiniciar() {
        this.alertas = new ArrayList<>();
        this.fallo = null;
    }
}