package com.medicore.api.services;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Stream;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.DynamicTest;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
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
    @DisplayName("un sintoma no se orienta (fase 1): se redirige a Me siento mal")
    void sintomasFueraDeAlcance() {
        AssistantMessageResponse respuesta = assistantService.responder("me duele la cabeza");

        assertEquals(AssistantMessageResponse.INTENT_FUERA_DE_ALCANCE, respuesta.intent());
        assertFalse(respuesta.emergencia());
        assertTrue(respuesta.respuesta().contains("Me siento mal"));
    }

    @Test
    @DisplayName("la ficha de un medicamento nunca incluye la dosis")
    void fichaSinDosis() {
        AssistantMessageResponse respuesta = assistantService.responder("¿Para qué sirve el ibuprofeno?");

        assertEquals(AssistantMessageResponse.INTENT_MEDICAMENTO, respuesta.intent());
        assertFalse(respuesta.respuesta().contains("Dosis habitual"));
        assertFalse(respuesta.respuesta().contains("400–600"), "no debe mostrar la posologia");
        assertTrue(respuesta.respuesta().toLowerCase().contains("prospecto"));
    }

    @Test
    @DisplayName("pedir una dosis se declina y no devuelve la del catalogo")
    void pedirDosisSeDeclina() {
        for (String mensaje : new String[] { "¿Cuánto ibuprofeno debo tomar?", "Recétame ibuprofeno",
                "¿Puedo tomar ibuprofeno con aspirina?" }) {
            AssistantMessageResponse respuesta = assistantService.responder(mensaje);

            assertEquals(AssistantMessageResponse.INTENT_FUERA_DE_ALCANCE, respuesta.intent(), mensaje);
            assertFalse(respuesta.respuesta().contains("Dosis habitual"), mensaje);
            assertFalse(respuesta.respuesta().contains("400–600"), mensaje);
        }
    }

    @Test
    @DisplayName("riesgo de autolesion: AUTOLESION con emergencia=true y el 123")
    void autolesion() {
        for (String mensaje : new String[] { "Quiero quitarme la vida", "No quiero vivir más", "Quiero morirme" }) {
            AssistantMessageResponse respuesta = assistantService.responder(mensaje);

            assertEquals(AssistantMessageResponse.INTENT_AUTOLESION, respuesta.intent(), mensaje);
            assertTrue(respuesta.emergencia(), mensaje);
            assertTrue(respuesta.respuesta().contains("123"), mensaje);
        }
    }

    @Test
    @DisplayName("la emergencia gana aunque el mensaje nombre un medicamento")
    void emergenciaGanaAlMedicamento() {
        AssistantMessageResponse respuesta =
                assistantService.responder("¿Cuánto ibuprofeno tomo? Me duele el pecho");

        assertEquals(AssistantMessageResponse.INTENT_EMERGENCIA, respuesta.intent());
        assertTrue(respuesta.emergencia());
    }

    @Test
    @DisplayName("un medicamento que no esta en el catalogo se dice claramente")
    void medicamentoNoEncontrado() {
        AssistantMessageResponse respuesta = assistantService.responder("¿Para qué sirve el sildenafil?");

        assertEquals(AssistantMessageResponse.INTENT_MEDICAMENTO_NO_ENCONTRADO, respuesta.intent());
        assertTrue(respuesta.respuesta().toLowerCase().contains("no encontre"));
    }

    @Test
    @DisplayName("una marca o alias apunta al medicamento del catalogo")
    void marcaYAlias() {
        assertEquals("Acetaminofén", assistantService.responder("¿Qué es Dolex?").datos().get("nombre"));
        assertEquals("Acetaminofén",
                assistantService.responder("para que sirve el paracetamol").datos().get("nombre"));
    }

    @Test
    @DisplayName("precio o compra: se declina aunque nombre un medicamento")
    void preciosYCompras() {
        for (String mensaje : new String[] { "¿Cuánto cuesta el ibuprofeno?", "¿Dónde compro loratadina?" }) {
            AssistantMessageResponse respuesta = assistantService.responder(mensaje);

            assertEquals(AssistantMessageResponse.INTENT_FUERA_DE_ALCANCE, respuesta.intent(), mensaje);
            assertFalse(respuesta.respuesta().contains("Dosis habitual"), mensaje);
        }
    }

    @Test
    @DisplayName("un saludo seguido de una pregunta responde la pregunta")
    void saludoConPregunta() {
        AssistantMessageResponse respuesta = assistantService.responder("Hola, ¿para qué sirve el ibuprofeno?");

        assertEquals(AssistantMessageResponse.INTENT_MEDICAMENTO, respuesta.intent());
    }

    @Test
    @DisplayName("'estos' no se confunde con el sintoma 'tos'")
    void tosDentroDeOtraPalabra() {
        AssistantMessageResponse respuesta = assistantService.responder("¿Para qué sirven estos medicamentos?");

        assertEquals(AssistantMessageResponse.INTENT_MEDICAMENTO_NO_ENCONTRADO, respuesta.intent());
    }

    /**
     * Casos de aceptacion de docs/assistant-acceptance-cases.json: cada mensaje
     * debe dar una de las intenciones esperadas, marcar emergencia cuando
     * corresponde y no contener los textos prohibidos (por ejemplo "Dosis habitual").
     */
    @TestFactory
    @DisplayName("casos de aceptacion del documento de intenciones")
    Stream<DynamicTest> casosDeAceptacion() throws IOException {
        Path archivo = Path.of("..", "..", "..", "docs", "assistant-acceptance-cases.json");
        assertTrue(Files.exists(archivo), "no se encuentra " + archivo.toAbsolutePath().normalize());

        JsonNode casos = new ObjectMapper().readTree(Files.readString(archivo)).get("cases");
        assertTrue(casos != null && casos.size() > 0, "el archivo no trae casos");

        List<DynamicTest> pruebas = new ArrayList<>();
        for (JsonNode caso : casos) {
            String id = caso.get("id").asText();
            String consulta = caso.get("query").asText();
            pruebas.add(DynamicTest.dynamicTest(id + " " + consulta, () -> {
                AssistantMessageResponse respuesta = assistantService.responder(consulta);

                List<String> esperadas = new ArrayList<>();
                caso.get("expectedBackendIntent").forEach(i -> esperadas.add(i.asText()));
                assertTrue(esperadas.contains(respuesta.intent()),
                        "intent " + respuesta.intent() + " no esta en " + esperadas);
                assertEquals(caso.get("emergencia").asBoolean(), respuesta.emergencia());
                if (caso.has("mustNotContain")) {
                    caso.get("mustNotContain").forEach(prohibido -> assertFalse(
                            respuesta.respuesta().contains(prohibido.asText()),
                            "no debe contener '" + prohibido.asText() + "'"));
                }
            }));
        }
        return pruebas.stream();
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
                "no puedo respirar", "que tengo", "blablabla", "quiero morirme", "para que sirve el sildenafil" }) {

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
