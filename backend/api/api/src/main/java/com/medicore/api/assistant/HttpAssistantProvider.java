package com.medicore.api.assistant;

import java.util.List;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.MediaType;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestClientResponseException;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

public class HttpAssistantProvider implements AssistantProvider {

    private static final Logger log = LoggerFactory.getLogger(HttpAssistantProvider.class);

    private static final String INSTRUCCION_SISTEMA = """
            Eres Mol, el asistente informativo de MediCore (Colombia), una app de
            informacion de medicamentos y alertas de salud publica.
            Reglas obligatorias:
            - Responde en espanol, en maximo 3 frases claras.
            - No diagnostiques, no indiques dosis, no recetes ni sugieras tratamientos.
            - No hables de precios ni de donde comprar medicamentos.
            - Si el usuario describe una posible urgencia (dolor de pecho, dificultad
              para respirar, desmayo, sangrado abundante), dile que llame al 123 o
              acuda a urgencias de inmediato.
            - Si no sabes algo o esta fuera de tu alcance, dilo y sugiere consultar a
              un profesional de salud.
            """;

    private final RestClient restClient;
    private final ObjectMapper json;
    private final String endpoint;
    private final String apiKey;
    private final String modelo;
    private final int maxTokens;

    public HttpAssistantProvider(RestClient restClient, ObjectMapper json,
                                 String endpoint, String apiKey, String modelo, int maxTokens) {
        this.restClient = restClient;
        this.json = json;
        this.endpoint = endpoint;
        this.apiKey = apiKey;
        this.modelo = modelo;
        this.maxTokens = maxTokens;
    }

    @Override
    public String responder(String pregunta) {
        if (endpoint == null || endpoint.isBlank() || apiKey == null || apiKey.isBlank()) {
            throw new AssistantProviderException(AssistantProviderException.Motivo.SIN_CONFIGURACION,
                    "Faltan ASSISTANT_ENDPOINT o ASSISTANT_API_KEY");
        }

        Map<String, Object> cuerpo = Map.of(
                "model", modelo,
                "temperature", 0.2,
                "max_tokens", maxTokens,
                "messages", List.of(
                        Map.of("role", "system", "content", INSTRUCCION_SISTEMA),
                        Map.of("role", "user", "content", pregunta)));

        try {
            String respuesta = restClient.post()
                    .uri(endpoint)
                    .header("Authorization", "Bearer " + apiKey)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(cuerpo)
                    .retrieve()
                    .body(String.class);

            return extraerTexto(respuesta);
        } catch (RestClientResponseException error) {
            log.warn("El proveedor de IA respondio {}", error.getStatusCode().value());
            throw new AssistantProviderException(AssistantProviderException.Motivo.ERROR_PROVEEDOR,
                    "HTTP " + error.getStatusCode().value());
        } catch (ResourceAccessException error) {
            log.warn("El proveedor de IA no respondio a tiempo: {}", error.getMessage());
            throw new AssistantProviderException(AssistantProviderException.Motivo.TIEMPO_AGOTADO,
                    "Tiempo de espera agotado");
        } catch (RestClientException error) {
            log.warn("Fallo de comunicacion con el proveedor de IA: {}", error.getMessage());
            throw new AssistantProviderException(AssistantProviderException.Motivo.ERROR_PROVEEDOR,
                    "Fallo de comunicacion");
        }
    }

    private String extraerTexto(String cuerpo) {
        if (cuerpo == null || cuerpo.isBlank()) {
            throw new AssistantProviderException(AssistantProviderException.Motivo.ERROR_PROVEEDOR,
                    "Respuesta vacia del proveedor");
        }
        try {
            JsonNode raiz = json.readTree(cuerpo);
            JsonNode contenido = raiz.path("choices").path(0).path("message").path("content");
            if (contenido.isMissingNode() || contenido.asText().isBlank()) {
                throw new AssistantProviderException(AssistantProviderException.Motivo.ERROR_PROVEEDOR,
                        "El proveedor no devolvio choices[0].message.content");
            }
            return contenido.asText();
        } catch (com.fasterxml.jackson.core.JsonProcessingException error) {
            throw new AssistantProviderException(AssistantProviderException.Motivo.ERROR_PROVEEDOR,
                    "Respuesta del proveedor no es JSON valido");
        }
    }
}