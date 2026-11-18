package com.medicore.api.services;

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

import com.medicore.api.assistant.AssistantProviderException;
import com.medicore.api.assistant.FakeAssistantConfiguration;
import com.medicore.api.assistant.FakeAssistantProvider;
import com.medicore.api.dto.AssistantChatResponse;
import com.medicore.api.dto.AssistantMessageResponse;

@SpringBootTest(properties = {
        "app.assistant.enabled=true",
        "app.assistant.provider=fake",
        "app.assistant.model=modelo-prueba"
})
@ActiveProfiles("dev")
@Import(FakeAssistantConfiguration.class)
class AssistantChatServiceTest {

    @Autowired
    private AssistantChatService chatService;

    @Autowired
    private FakeAssistantProvider fakeProvider;

    @BeforeEach
    void limpiar() {
        fakeProvider.reiniciar();
    }

    @Test
    @DisplayName("una emergencia no consulta al modelo")
    void emergenciaNoConsultaAlModelo() {
        AssistantChatResponse respuesta = chatService.responder("me duele el pecho y no puedo respirar");

        assertEquals(AssistantMessageResponse.INTENT_EMERGENCIA, respuesta.intent());
        assertTrue(respuesta.emergencia());
        assertEquals(0, fakeProvider.llamadas(), "la emergencia la resuelven las reglas");
        assertEquals(AssistantChatResponse.ORIGEN_REGLAS, respuesta.origen());
    }

    @Test
    @DisplayName("una pregunta de medicamento del catalogo no consulta al modelo")
    void medicamentoNoConsultaAlModelo() {
        AssistantChatResponse respuesta = chatService.responder("para que sirve el ibuprofeno");

        assertEquals(AssistantMessageResponse.INTENT_MEDICAMENTO, respuesta.intent());
        assertEquals(0, fakeProvider.llamadas());
        assertEquals(AssistantChatResponse.ORIGEN_REGLAS, respuesta.origen());
    }

    @Test
    @DisplayName("un mensaje desconocido lo responde el modelo")
    void mensajeDesconocidoUsaElModelo() {
        fakeProvider.responderCon("Esa pregunta esta fuera de mi alcance.");

        AssistantChatResponse respuesta = chatService.responder("cual es la capital de francia");

        assertEquals(1, fakeProvider.llamadas());
        assertEquals(AssistantChatService.INTENT_RESPUESTA_MODELO, respuesta.intent());
        assertEquals(AssistantChatResponse.ORIGEN_MODELO, respuesta.origen());
        assertEquals("Esa pregunta esta fuera de mi alcance.", respuesta.respuesta());
        assertEquals("modelo-prueba", respuesta.modelo());
        assertNotNull(respuesta.latenciaMs());
        assertEquals(respuesta.respuesta(), respuesta.reply(), "reply es el alias del frontend");
        assertFalse(respuesta.disclaimer().isBlank());
        assertNotNull(respuesta.suggested_actions(), "suggested_actions es el alias del frontend");
    }

    @Test
    @DisplayName("el texto del modelo se normaliza antes de responder")
    void normalizaLaRespuestaDelModelo() {
        fakeProvider.responderCon("  ```js\nHola   mundo```  ");

        AssistantChatResponse respuesta = chatService.responder("cual es la capital de francia");

        assertEquals("Hola mundo", respuesta.respuesta());
    }

    @Test
    @DisplayName("si el proveedor se pasa del tiempo se responde el respaldo")
    void tiempoAgotadoDevuelveRespaldo() {
        fakeProvider.fallarCon(AssistantProviderException.Motivo.TIEMPO_AGOTADO, "sin respuesta del socket");

        AssistantChatResponse respuesta = chatService.responder("cual es la capital de francia");

        assertEquals(1, fakeProvider.llamadas(), "se intento consultar");
        assertEquals(AssistantChatResponse.ORIGEN_RESPALDO, respuesta.origen());
        assertEquals(AssistantChatService.MENSAJE_RESPALDO, respuesta.respuesta());
        assertFalse(respuesta.respuesta().contains("socket"), "no filtra el detalle tecnico");
        assertEquals(AssistantMessageResponse.INTENT_NO_ENTENDIDO, respuesta.intent());
    }

    @Test
    @DisplayName("si el proveedor responde error se responde el respaldo")
    void errorDelProveedorDevuelveRespaldo() {
        fakeProvider.fallarCon(AssistantProviderException.Motivo.ERROR_PROVEEDOR, "HTTP 500");

        AssistantChatResponse respuesta = chatService.responder("cual es la capital de francia");

        assertEquals(AssistantChatResponse.ORIGEN_RESPALDO, respuesta.origen());
        assertEquals(AssistantChatService.MENSAJE_RESPALDO, respuesta.respuesta());
        assertFalse(respuesta.respuesta().contains("500"));
        assertFalse(respuesta.respuesta().contains("HTTP"));
    }

    @Test
    @DisplayName("una respuesta vacia del modelo tambien cae en el respaldo")
    void respuestaVaciaDevuelveRespaldo() {
        fakeProvider.responderCon("   ");

        AssistantChatResponse respuesta = chatService.responder("cual es la capital de francia");

        assertEquals(AssistantChatResponse.ORIGEN_RESPALDO, respuesta.origen());
        assertEquals(AssistantChatService.MENSAJE_RESPALDO, respuesta.respuesta());
    }
}