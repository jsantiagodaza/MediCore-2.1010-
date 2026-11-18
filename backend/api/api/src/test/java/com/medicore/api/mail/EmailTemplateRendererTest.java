package com.medicore.api.mail;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.HashMap;
import java.util.Map;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class EmailTemplateRendererTest {

    private final EmailTemplateRenderer renderer = new EmailTemplateRenderer();

    private Map<String, String> valores() {
        Map<String, String> valores = new HashMap<>();
        valores.put("nombre", "Jainer");
        valores.put("titulo", "Dengue en aumento en Valledupar");
        valores.put("descripcion", "Elimina criaderos de agua estancada.");
        valores.put("categoria", "Enfermedad transmitida por vectores");
        valores.put("riesgo", "ALTO");
        valores.put("riesgo_color", "#ea580c");
        valores.put("ubicacion", "Valledupar, Cesar");
        valores.put("fuente", "Secretaria de Salud del Cesar");
        valores.put("vigencia", "2026-11-01 a 2026-12-31");
        valores.put("anio", "2026");
        return valores;
    }

    @Test
    @DisplayName("el HTML queda con la identidad de MediCore y sin marcadores")
    void renderizaHtml() {
        String html = renderer.renderHtml("alert-notification.html", valores());

        assertTrue(html.contains("MediCore"));
        assertTrue(html.contains("Dengue en aumento en Valledupar"));
        assertTrue(html.contains("#ea580c"), "usa el color del nivel de riesgo");
        assertFalse(html.contains("{{"), "no debe quedar ningun marcador sin reemplazar");
    }

    @Test
    @DisplayName("el texto plano tambien reemplaza los marcadores")
    void renderizaTexto() {
        String texto = renderer.renderText("alert-notification.txt", valores());

        assertTrue(texto.contains("Hola Jainer"));
        assertTrue(texto.contains("Valledupar, Cesar"));
        assertFalse(texto.contains("{{"));
    }

    @Test
    @DisplayName("el HTML escapa etiquetas para que una alerta no inyecte codigo")
    void escapaEtiquetasEnHtml() {
        Map<String, String> valores = valores();
        valores.put("titulo", "<script>alert('x')</script>");

        String html = renderer.renderHtml("alert-notification.html", valores);

        assertTrue(html.contains("&lt;script&gt;"));
        assertFalse(html.contains("<script>alert('x')</script>"));
    }

    @Test
    @DisplayName("una plantilla inexistente falla de forma clara")
    void plantillaInexistente() {
        assertThrows(IllegalStateException.class,
                () -> renderer.renderHtml("no-existe.html", valores()));
    }
}