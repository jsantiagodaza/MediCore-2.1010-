package com.medicore.api.services;

import static org.junit.jupiter.api.Assertions.assertEquals;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;

import com.medicore.api.assistant.FakeAssistantConfiguration;
import com.medicore.api.assistant.FakeAssistantProvider;
import com.medicore.api.dto.AssistantChatResponse;
import com.medicore.api.dto.AssistantMessageResponse;

@SpringBootTest(properties = {
        "app.assistant.enabled=false",
        "app.assistant.provider=fake"
})
@ActiveProfiles("dev")
@Import(FakeAssistantConfiguration.class)
class AssistantChatServiceDeshabilitadoTest {

    @Autowired
    private AssistantChatService chatService;

    @Autowired
    private FakeAssistantProvider fakeProvider;

    @Test
    @DisplayName("con el modelo apagado no se consulta al proveedor")
    void modeloApagadoNoConsulta() {
        AssistantChatResponse respuesta = chatService.responder("cual es la capital de francia");

        assertEquals(0, fakeProvider.llamadas());
        assertEquals(AssistantChatResponse.ORIGEN_REGLAS, respuesta.origen());
        assertEquals(AssistantMessageResponse.INTENT_NO_ENTENDIDO, respuesta.intent());
    }
}