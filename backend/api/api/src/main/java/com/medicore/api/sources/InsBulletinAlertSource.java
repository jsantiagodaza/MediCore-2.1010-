package com.medicore.api.sources;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Objects;

import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestClientResponseException;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.medicore.api.models.RiskLevel;

public class InsBulletinAlertSource implements AlertSource {

    private static final String ID = "ins";

    private final RestClient restClient;
    private final ObjectMapper json;
    private final String url;

    public InsBulletinAlertSource(RestClient restClient, ObjectMapper json, String url) {
        this.restClient = restClient;
        this.json = json;
        this.url = url;
    }

    @Override
    public String id() {
        return ID;
    }

    @Override
    public String nombre() {
        return "INS - boletines epidemiologicos";
    }

    @Override
    public List<ExternalAlert> consultar() {
        JsonNode raiz = leer(descargar());

        if (!raiz.isArray()) {
            throw new AlertSourceException(AlertSourceException.Motivo.DATOS_INVALIDOS,
                    "El boletin del INS no es una lista de eventos");
        }

        List<ExternalAlert> alertas = new ArrayList<>();
        for (JsonNode fila : raiz) {
            alertas.add(mapear(fila));
        }
        return alertas;
    }

    private ExternalAlert mapear(JsonNode fila) {
        String evento = texto(fila, "evento", "nombre_evento", "enfermedad", "nombre");
        String municipio = texto(fila, "municipio", "ciudad", "nombre_municipio");
        String departamento = texto(fila, "departamento", "region", "nombre_departamento");
        String nivel = texto(fila, "nivel", "riesgo", "nivel_riesgo", "severidad");
        String descripcion = texto(fila, "descripcion", "observaciones", "detalle");

        LocalDate inicio = fecha(texto(fila, "fecha_inicio", "fecha", "fecha_reporte",
                "fecha_notificacion", "fecha_evento"));
        LocalDate fin = fecha(texto(fila, "fecha_fin", "fecha_cierre"));

        String identificador = texto(fila, "id", "_id", "codigo", "codigo_evento");
        if (identificador == null) {
            identificador = "ins-" + Integer.toHexString(Objects.hash(evento, municipio, inicio));
        }

        String titulo = evento == null || evento.isBlank()
                ? null
                : "Alerta por " + evento + (municipio == null ? "" : " en " + municipio);

        String detalle = descripcion != null && !descripcion.isBlank()
                ? descripcion
                : "Evento de vigilancia reportado por el Instituto Nacional de Salud.";

        return new ExternalAlert(
                identificador,
                titulo,
                detalle,
                categoriaDe(evento),
                riesgoDe(nivel),
                municipio,
                departamento == null || departamento.isBlank() ? "Nacional" : departamento,
                "Instituto Nacional de Salud",
                inicio,
                fin);
    }

    static String categoriaDe(String evento) {
        if (evento == null) {
            return "Vigilancia epidemiologica";
        }
        String texto = evento.toLowerCase(Locale.ROOT);
        if (texto.contains("dengue") || texto.contains("chikung") || texto.contains("zika")
                || texto.contains("fiebre amarilla") || texto.contains("malaria")
                || texto.contains("leishman")) {
            return "Enfermedad transmitida por vectores";
        }
        if (texto.contains("influenza") || texto.contains("ira") || texto.contains("respiratoria")
                || texto.contains("covid") || texto.contains("neumonia")) {
            return "Enfermedad respiratoria";
        }
        if (texto.contains("diarrea") || texto.contains("eda") || texto.contains("colera")) {
            return "Enfermedad diarreica";
        }
        if (texto.contains("sarampion") || texto.contains("varicela") || texto.contains("tos ferina")) {
            return "Enfermedad prevenible por vacuna";
        }
        return "Vigilancia epidemiologica";
    }

    static RiskLevel riesgoDe(String nivel) {
        if (nivel == null) {
            return RiskLevel.MEDIO;
        }
        String texto = nivel.toLowerCase(Locale.ROOT);
        if (texto.contains("critic") || texto.contains("muy alto")) {
            return RiskLevel.CRITICO;
        }
        if (texto.contains("alto")) {
            return RiskLevel.ALTO;
        }
        if (texto.contains("bajo")) {
            return RiskLevel.BAJO;
        }
        return RiskLevel.MEDIO;
    }

    private String texto(JsonNode fila, String... campos) {
        for (String campo : campos) {
            JsonNode valor = fila.get(campo);
            if (valor != null && !valor.isNull() && !valor.asText().isBlank()) {
                return valor.asText().trim();
            }
        }
        return null;
    }

    private LocalDate fecha(String valor) {
        if (valor == null || valor.isBlank()) {
            return null;
        }
        try {
            return LocalDate.parse(valor.length() > 10 ? valor.substring(0, 10) : valor);
        } catch (RuntimeException error) {
            return null;
        }
    }

    private String descargar() {
        try {
            return restClient.get().uri(url).retrieve().body(String.class);
        } catch (ResourceAccessException error) {
            throw new AlertSourceException(AlertSourceException.Motivo.NO_DISPONIBLE,
                    "El boletin del INS no respondio a tiempo");
        } catch (RestClientResponseException error) {
            throw new AlertSourceException(AlertSourceException.Motivo.NO_DISPONIBLE,
                    "El boletin del INS respondio " + error.getStatusCode().value());
        } catch (RestClientException error) {
            throw new AlertSourceException(AlertSourceException.Motivo.NO_DISPONIBLE,
                    "Fallo de comunicacion con el INS");
        }
    }

    private JsonNode leer(String cuerpo) {
        if (cuerpo == null || cuerpo.isBlank()) {
            throw new AlertSourceException(AlertSourceException.Motivo.DATOS_INVALIDOS,
                    "El boletin del INS llego vacio");
        }
        try {
            return json.readTree(cuerpo);
        } catch (com.fasterxml.jackson.core.JsonProcessingException error) {
            throw new AlertSourceException(AlertSourceException.Motivo.DATOS_INVALIDOS,
                    "El boletin del INS no es JSON valido");
        }
    }
}