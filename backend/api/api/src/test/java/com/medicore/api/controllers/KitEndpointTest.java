package com.medicore.api.controllers;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import org.springframework.transaction.annotation.Transactional;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.medicore.api.dto.LoginRequest;
import com.medicore.api.repositories.MedicineRepository;
import com.medicore.api.services.AuthService;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("dev")
@Transactional
class KitEndpointTest {

    private static final String URL = "/api/v1/me/kit";
    private static final String PASSWORD = "Contrasena123";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper json;

    @Autowired
    private AuthService authService;

    @Autowired
    private MedicineRepository medicineRepository;

    private Long medicamentoId(int posicion) {
        return medicineRepository.findAll().get(posicion).getId();
    }

    private String tokenDe(String email) throws Exception {
        authService.register(email, PASSWORD, "Prueba");

        String respuesta = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(new LoginRequest(email, PASSWORD))))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        return json.readTree(respuesta).get("token").asText();
    }

    private String cuerpo(Long medicineId, Integer cantidad) throws Exception {
        return json.writeValueAsString(new com.medicore.api.dto.KitItemRequest(medicineId, cantidad, "prueba"));
    }

    @Test
    @DisplayName("el botiquin exige token")
    void exigeToken() throws Exception {
        mockMvc.perform(get(URL)).andExpect(status().isUnauthorized());
        mockMvc.perform(put(URL)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(cuerpo(medicamentoId(0), 1)))
                .andExpect(status().isUnauthorized());
        mockMvc.perform(delete(URL + "/1")).andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("un botiquin vacio responde 200 con lista vacia")
    void botiquinVacioDevuelveListaVacia() throws Exception {
        String token = tokenDe("kit-vacio-http@medicore.com");

        mockMvc.perform(get(URL).header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(0));
    }

    @Test
    @DisplayName("devuelve los campos que el PDF necesita")
    void devuelveCamposParaElPdf() throws Exception {
        String token = tokenDe("kit-pdf@medicore.com");
        Long medicamento = medicamentoId(0);

        mockMvc.perform(put(URL)
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(cuerpo(medicamento, 2)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.medicineId").value(medicamento))
                .andExpect(jsonPath("$.name").isNotEmpty())
                .andExpect(jsonPath("$.quantity").value(2))
                .andExpect(jsonPath("$.dose").exists())
                .andExpect(jsonPath("$.uses").isNotEmpty())
                .andExpect(jsonPath("$.category").isNotEmpty())
                .andExpect(jsonPath("$.precautions").isArray())
                .andExpect(jsonPath("$.updatedAt").isNotEmpty());

        mockMvc.perform(get(URL).header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].name").isNotEmpty())
                .andExpect(jsonPath("$[0].uses").isNotEmpty());
    }

    @Test
    @DisplayName("borra el medicamento y el botiquin queda vacio")
    void borraYQuedaVacio() throws Exception {
        String token = tokenDe("kit-borra-http@medicore.com");
        Long medicamento = medicamentoId(0);

        mockMvc.perform(put(URL)
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(cuerpo(medicamento, 1)))
                .andExpect(status().isOk());

        mockMvc.perform(delete(URL + "/" + medicamento)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isNoContent());

        mockMvc.perform(get(URL).header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(0));
    }

    @Test
    @DisplayName("un usuario no alcanza ni modifica el botiquin de otro")
    void aislamientoEntreUsuarios() throws Exception {
        String tokenA = tokenDe("kit-a@medicore.com");
        String tokenB = tokenDe("kit-b@medicore.com");
        Long medicamento = medicamentoId(0);

        mockMvc.perform(put(URL)
                        .header("Authorization", "Bearer " + tokenA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(cuerpo(medicamento, 1)))
                .andExpect(status().isOk());

        mockMvc.perform(get(URL).header("Authorization", "Bearer " + tokenB))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(0));

        mockMvc.perform(get(URL + "/" + medicamento)
                        .header("Authorization", "Bearer " + tokenB))
                .andExpect(status().isNotFound());

        mockMvc.perform(delete(URL + "/" + medicamento)
                        .header("Authorization", "Bearer " + tokenB))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("una peticion sin medicamento responde 400")
    void sinMedicamento() throws Exception {
        String token = tokenDe("kit-sin-med@medicore.com");

        mockMvc.perform(put(URL)
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"quantity\":2}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.mensaje").value("El medicamento es obligatorio"));
    }
}