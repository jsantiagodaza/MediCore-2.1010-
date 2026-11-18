package com.medicore.api.mail;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.Map;

import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Component;
import org.springframework.util.StreamUtils;

@Component
public class EmailTemplateRenderer {

    private static final String CARPETA = "templates/email/";

    public String renderHtml(String plantilla, Map<String, String> valores) {
        String contenido = leer(plantilla);
        for (Map.Entry<String, String> entrada : valores.entrySet()) {
            contenido = contenido.replace("{{" + entrada.getKey() + "}}",
                    escapar(entrada.getValue()));
        }
        return contenido;
    }

    public String renderText(String plantilla, Map<String, String> valores) {
        String contenido = leer(plantilla);
        for (Map.Entry<String, String> entrada : valores.entrySet()) {
            contenido = contenido.replace("{{" + entrada.getKey() + "}}",
                    entrada.getValue() == null ? "" : entrada.getValue());
        }
        return contenido;
    }

    private String leer(String plantilla) {
        Resource recurso = new ClassPathResource(CARPETA + plantilla);
        if (!recurso.exists()) {
            throw new IllegalStateException("No existe la plantilla de correo " + CARPETA + plantilla);
        }
        try (InputStream entrada = recurso.getInputStream()) {
            return StreamUtils.copyToString(entrada, StandardCharsets.UTF_8);
        } catch (IOException error) {
            throw new IllegalStateException("No se pudo leer la plantilla " + plantilla, error);
        }
    }

    private String escapar(String valor) {
        if (valor == null) {
            return "";
        }
        return valor.replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;");
    }
}