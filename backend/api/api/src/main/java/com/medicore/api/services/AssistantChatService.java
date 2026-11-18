package com.medicore.api.services;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.medicore.api.assistant.AssistantProvider;
import com.medicore.api.assistant.AssistantProviderException;
import com.medicore.api.dto.AssistantChatResponse;
import com.medicore.api.dto.AssistantMessageResponse;

@Service
public class AssistantChatService {

    private static final Logger log = LoggerFactory.getLogger(AssistantChatService.class);

    public static final String INTENT_RESPUESTA_MODELO = "RESPUESTA_MODELO";

    private static final int MAX_RESPUESTA = 600;

    static final String MENSAJE_RESPALDO =
            "Ahora mismo no puedo consultar el asistente. Intenta de nuevo en un momento; "
                    + "mientras tanto puedo ayudarte con el catalogo de medicamentos.";

    private final AssistantService assistantService;
    private final ObjectProvider<AssistantProvider> providerProvider;
    private final String modelo;
    private final boolean habilitado;

    public AssistantChatService(AssistantService assistantService,
                                ObjectProvider<AssistantProvider> providerProvider,
                                @Value("${app.assistant.model:modelo}") String modelo,
                                @Value("${app.assistant.enabled:false}") boolean habilitado) {
        this.assistantService = assistantService;
        this.providerProvider = providerProvider;
        this.modelo = modelo;
        this.habilitado = habilitado;
    }

    public AssistantChatResponse responder(String mensaje) {
        AssistantMessageResponse reglas = assistantService.responder(mensaje);

        if (!habilitado || !AssistantMessageResponse.INTENT_NO_ENTENDIDO.equals(reglas.intent())) {
            return AssistantChatResponse.desdeReglas(reglas);
        }

        AssistantProvider provider = providerProvider.getIfAvailable();
        if (provider == null) {
            return AssistantChatResponse.desdeReglas(reglas);
        }

        long inicio = System.currentTimeMillis();
        try {
            String texto = normalizar(provider.responder(mensaje));
            if (texto.isEmpty()) {
                return AssistantChatResponse.respaldo(reglas, MENSAJE_RESPALDO);
            }
            long latencia = System.currentTimeMillis() - inicio;
            log.info("Respuesta del modelo de IA en {} ms", latencia);
            return AssistantChatResponse.desdeModelo(reglas, texto, modelo, latencia);
        } catch (AssistantProviderException error) {
            log.warn("Asistente sin modelo ({}): {}", error.getMotivo(), error.getMessage());
            return AssistantChatResponse.respaldo(reglas, MENSAJE_RESPALDO);
        } catch (RuntimeException error) {
            log.error("Error inesperado consultando el modelo de IA", error);
            return AssistantChatResponse.respaldo(reglas, MENSAJE_RESPALDO);
        }
    }

    static String normalizar(String texto) {
        if (texto == null) {
            return "";
        }
        String limpio = texto
                .replace("\r", " ")
                .replace("\n", " ")
                .replaceAll("```[a-zA-Z]*", " ")
                .replaceAll("\\s+", " ")
                .trim();

        if (limpio.startsWith("\"") && limpio.endsWith("\"") && limpio.length() > 1) {
            limpio = limpio.substring(1, limpio.length() - 1).trim();
        }
        return limpio.length() <= MAX_RESPUESTA ? limpio : limpio.substring(0, MAX_RESPUESTA).trim();
    }
}