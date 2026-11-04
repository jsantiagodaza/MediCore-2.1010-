package com.medicore.api.services;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import com.medicore.api.dto.AssistantMessageResponse;

/**
 * Pruebas del motor del asistente, sin pasar por HTTP.
 */
@SpringBootTest
@ActiveProfiles("dev")
class AssistantServiceTest {

    @Autowired
    private AssistantService assistantService;

    @Test
    @DisplayName("un saludo devuelve la intencion SALUDO")
    void saludo() {
        AssistantMessageResponse respuesta = assistantService.responder("Hola, ¿qué tal?");

        assertEquals(AssistantMessageResponse.INTENT_SALUDO, respuesta.intent());
        assertFalse(respuesta.emergencia());
        assertTrue(respuesta.respuesta().toLowerCase().contains("mol"));
    }

    @Test
    @DisplayName("pregunta por un medicamento: devuelve su informacion desde la base de datos")
    void preguntaPorMedicamento() {
        AssistantMessageResponse respuesta = assistantService.responder("¿Para qué sirve el ibuprofeno?");

        assertEquals(AssistantMessageResponse.INTENT_MEDICAMENTO, respuesta.intent());
        assertEquals("Ibuprofeno", respuesta.datos().get("nombre"));
        assertNotNull(respuesta.datos().get("medicamentoId"));
        assertTrue(respuesta.respuesta().contains("Ibuprofeno"));
        assertTrue(respuesta.respuesta().toLowerCase().contains("precauciones"));
        assertTrue(respuesta.fuentes().stream().anyMatch(f -> f.contains("Ibuprofeno")));
        assertTrue(respuesta.confianza() > 0.5);
    }

    @Test
    @DisplayName("encuentra el medicamento aunque se escriba sin tildes")
    void medicamentoSinTildes() {
        AssistantMessageResponse respuesta = assistantService.responder("para que sirve acetaminofen");

        assertEquals(AssistantMessageResponse.INTENT_MEDICAMENTO, respuesta.intent());
        assertEquals("Acetaminofén", respuesta.datos().get("nombre"));
    }

    @Test
    @DisplayName("una urgencia tiene prioridad y devuelve emergencia=true")
    void urgencia() {
        AssistantMessageResponse respuesta =
                assistantService.responder("tengo dolor de pecho y me falta el aire");

        assertEquals(AssistantMessageResponse.INTENT_EMERGENCIA, respuesta.intent());
        assertTrue(respuesta.emergencia());
        assertTrue(respuesta.respuesta().contains("123")
                || respuesta.respuesta().toLowerCase().contains("urgencias"));
        assertTrue(respuesta.confianza() >= 0.9);
    }

    @Test
    @DisplayName("no diagnostica: peticion de diagnostico queda fuera de alcance")
    void noDiagnostica() {
        AssistantMessageResponse respuesta = assistantService.responder("que tengo si me duele la cabeza");

        assertEquals(AssistantMessageResponse.INTENT_FUERA_DE_ALCANCE, respuesta.intent());
        assertTrue(respuesta.respuesta().toLowerCase().contains("no puedo diagnosticar"));
    }

    @Test
    @DisplayName("un sintoma sin diagnostico recibe orientacion general")
    void orientacionPorSintomas() {
        AssistantMessageResponse respuesta = assistantService.responder("me duele la cabeza");

        assertEquals(AssistantMessageResponse.INTENT_SINTOMAS, respuesta.intent());
        assertTrue(respuesta.respuesta().toLowerCase().contains("orientacion"));
    }

    @Test
    @DisplayName("un mensaje no relacionado cae en NO_ENTENDIDO")
    void noEntendido() {
        AssistantMessageResponse respuesta = assistantService.responder("cual es la capital de Francia");

        assertEquals(AssistantMessageResponse.INTENT_NO_ENTENDIDO, respuesta.intent());
        assertTrue(respuesta.confianza() < 0.5);
        assertFalse(respuesta.sugerencias().isEmpty());
    }

    @Test
    @DisplayName("un mensaje vacio o null no rompe el servicio")
    void mensajeVacioONulo() {
        assertEquals(AssistantMessageResponse.INTENT_NO_ENTENDIDO,
                assistantService.responder("").intent());
        assertEquals(AssistantMessageResponse.INTENT_NO_ENTENDIDO,
                assistantService.responder("   ").intent());
        assertEquals(AssistantMessageResponse.INTENT_NO_ENTENDIDO,
                assistantService.responder(null).intent());
    }

    @Test
    @DisplayName("todas las respuestas son estructuradas y coherentes")
    void respuestaEstructurada() {
        for (String mensaje : new String[] { "hola", "ibuprofeno", "me duele la cabeza",
                "no puedo respirar", "que tengo", "blablabla" }) {

            AssistantMessageResponse respuesta = assistantService.responder(mensaje);

            assertNotNull(respuesta.id(), "cada respuesta tiene id");
            assertNotNull(respuesta.respuesta(), "cada respuesta tiene texto");
            assertFalse(respuesta.respuesta().isBlank());
            assertNotNull(respuesta.intent());
            assertTrue(respuesta.confianza() >= 0.0 && respuesta.confianza() <= 1.0);
            assertNotNull(respuesta.sugerencias());
            assertNotNull(respuesta.fuentes());
            assertNotNull(respuesta.datos());
            assertNotNull(respuesta.timestamp());
        }
    }
}
