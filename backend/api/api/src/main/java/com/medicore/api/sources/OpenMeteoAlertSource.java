package com.medicore.api.sources;

import java.net.URI;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestClientResponseException;
import org.springframework.web.util.UriComponentsBuilder;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.medicore.api.models.RiskLevel;

public class OpenMeteoAlertSource implements AlertSource {

    private static final String ID = "open-meteo";

    private final RestClient restClient;
    private final ObjectMapper json;
    private final String url;
    private final double latitud;
    private final double longitud;
    private final String ciudad;
    private final String region;
    private final double calorMedio;
    private final double calorAlto;
    private final double frioMedio;
    private final double frioAlto;

    public OpenMeteoAlertSource(RestClient restClient, ObjectMapper json, String url,
                                double latitud, double longitud, String ciudad, String region,
                                double calorMedio, double calorAlto,
                                double frioMedio, double frioAlto) {
        this.restClient = restClient;
        this.json = json;
        this.url = url;
        this.latitud = latitud;
        this.longitud = longitud;
        this.ciudad = ciudad;
        this.region = region;
        this.calorMedio = calorMedio;
        this.calorAlto = calorAlto;
        this.frioMedio = frioMedio;
        this.frioAlto = frioAlto;
    }

    @Override
    public String id() {
        return ID;
    }

    @Override
    public String nombre() {
        return "Open-Meteo (clima)";
    }

    @Override
    public List<ExternalAlert> consultar() {
        JsonNode raiz = leer(descargar());

        JsonNode maximos = raiz.path("daily").path("temperature_2m_max");
        JsonNode minimos = raiz.path("daily").path("temperature_2m_min");
        JsonNode fechas = raiz.path("daily").path("time");

        if (!maximos.isArray() || !minimos.isArray() || !fechas.isArray()
                || maximos.isEmpty() || minimos.isEmpty() || fechas.isEmpty()) {
            throw new AlertSourceException(AlertSourceException.Motivo.DATOS_INVALIDOS,
                    "Open-Meteo no devolvio temperature_2m_max/min y time");
        }

        LocalDate fecha = LocalDate.parse(fechas.get(0).asText());
        double maxima = maximos.get(0).asDouble();
        double minima = minimos.get(0).asDouble();

        List<ExternalAlert> alertas = new ArrayList<>();

        if (maxima >= calorAlto) {
            alertas.add(calor(fecha, maxima, RiskLevel.ALTO));
        } else if (maxima >= calorMedio) {
            alertas.add(calor(fecha, maxima, RiskLevel.MEDIO));
        }

        if (minima <= frioAlto) {
            alertas.add(frio(fecha, minima, RiskLevel.ALTO));
        } else if (minima <= frioMedio) {
            alertas.add(frio(fecha, minima, RiskLevel.MEDIO));
        }

        return alertas;
    }

    private ExternalAlert calor(LocalDate fecha, double maxima, RiskLevel nivel) {
        return new ExternalAlert(
                "calor-" + fecha,
                "Calor extremo en " + ciudad,
                "Temperatura maxima prevista de " + maxima + " grados. Hidratate durante todo el dia "
                        + "y evita la exposicion al sol entre 10 a. m. y 4 p. m.",
                "Clima extremo", nivel, ciudad, region, "Open-Meteo", fecha, fecha);
    }

    private ExternalAlert frio(LocalDate fecha, double minima, RiskLevel nivel) {
        return new ExternalAlert(
                "frio-" + fecha,
                "Frio intenso en " + ciudad,
                "Temperatura minima prevista de " + minima + " grados. Abrigate y protege a menores "
                        + "y adultos mayores.",
                "Clima extremo", nivel, ciudad, region, "Open-Meteo", fecha, fecha);
    }

    private String descargar() {
        URI destino = UriComponentsBuilder.fromHttpUrl(url)
                .queryParam("latitude", latitud)
                .queryParam("longitude", longitud)
                .queryParam("daily", "temperature_2m_max,temperature_2m_min")
                .queryParam("timezone", "America/Bogota")
                .queryParam("forecast_days", 1)
                .build()
                .toUri();

        try {
            return restClient.get().uri(destino).retrieve().body(String.class);
        } catch (ResourceAccessException error) {
            throw new AlertSourceException(AlertSourceException.Motivo.NO_DISPONIBLE,
                    "Open-Meteo no respondio a tiempo");
        } catch (RestClientResponseException error) {
            throw new AlertSourceException(AlertSourceException.Motivo.NO_DISPONIBLE,
                    "Open-Meteo respondio " + error.getStatusCode().value());
        } catch (RestClientException error) {
            throw new AlertSourceException(AlertSourceException.Motivo.NO_DISPONIBLE,
                    "Fallo de comunicacion con Open-Meteo");
        }
    }

    private JsonNode leer(String cuerpo) {
        if (cuerpo == null || cuerpo.isBlank()) {
            throw new AlertSourceException(AlertSourceException.Motivo.DATOS_INVALIDOS,
                    "Open-Meteo devolvio una respuesta vacia");
        }
        try {
            return json.readTree(cuerpo);
        } catch (com.fasterxml.jackson.core.JsonProcessingException error) {
            throw new AlertSourceException(AlertSourceException.Motivo.DATOS_INVALIDOS,
                    "La respuesta de Open-Meteo no es JSON valido");
        }
    }
}