package com.medicore.api.config;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpHeaders;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest(properties = {
        "cors.allowed-origins=http://localhost:5173,http://localhost:4173,https://*.vercel.app"
})
@AutoConfigureMockMvc
@ActiveProfiles("dev")
class CorsWildcardTest {

    private static final String LOGIN = "/api/v1/auth/login";
    private static final String ALERTAS = "/api/v1/alerts";

    @Autowired
    private MockMvc mockMvc;

    @Test
    @DisplayName("el preview de Vite (4173) esta permitido")
    void previewVitePermitido() throws Exception {
        mockMvc.perform(options(LOGIN)
                        .header(HttpHeaders.ORIGIN, "http://localhost:4173")
                        .header(HttpHeaders.ACCESS_CONTROL_REQUEST_METHOD, "POST"))
                .andExpect(status().isOk())
                .andExpect(header().string(HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN, "http://localhost:4173"));
    }

    @Test
    @DisplayName("un despliegue de Vercel entra por el comodin y recibe su propio origen")
    void previewVercelPermitido() throws Exception {
        String origen = "https://medicore-frontend-a1b2c3.vercel.app";

        mockMvc.perform(get(ALERTAS).header(HttpHeaders.ORIGIN, origen))
                .andExpect(status().isOk())
                .andExpect(header().string(HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN, origen));
    }

    @Test
    @DisplayName("el comodin no abre otros subdominios ni otros dominios")
    void comodinNoAbreOtrosDominios() throws Exception {
        mockMvc.perform(options(LOGIN)
                        .header(HttpHeaders.ORIGIN, "https://sitio-malicioso.example")
                        .header(HttpHeaders.ACCESS_CONTROL_REQUEST_METHOD, "POST"))
                .andExpect(status().isForbidden())
                .andExpect(header().doesNotExist(HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN));

        mockMvc.perform(get(ALERTAS).header(HttpHeaders.ORIGIN, "https://sitio-malicioso.example"))
                .andExpect(header().doesNotExist(HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN));
    }
}