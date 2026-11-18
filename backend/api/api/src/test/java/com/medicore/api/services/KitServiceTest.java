package com.medicore.api.services;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import com.medicore.api.dto.KitItemRequest;
import com.medicore.api.dto.KitItemResponse;
import com.medicore.api.models.Medicine;
import com.medicore.api.models.User;
import com.medicore.api.repositories.MedicineRepository;

@SpringBootTest
@ActiveProfiles("dev")
@Transactional
class KitServiceTest {

    private static final String PASSWORD = "Contrasena123";

    @Autowired
    private KitService kitService;

    @Autowired
    private AuthService authService;

    @Autowired
    private MedicineRepository medicineRepository;

    private User usuario(String email) {
        return authService.register(email, PASSWORD, "Prueba");
    }

    private Long medicamentoId(int posicion) {
        List<Medicine> catalogo = medicineRepository.findAll();
        return catalogo.get(posicion).getId();
    }

    @Test
    @DisplayName("un usuario nuevo tiene el botiquin vacio")
    void botiquinVacio() {
        User usuario = usuario("kit-vacio@medicore.com");

        assertTrue(kitService.listar(usuario).isEmpty());
    }

    @Test
    @DisplayName("agrega un medicamento con cantidad y nota")
    void agregaMedicamento() {
        User usuario = usuario("kit-agrega@medicore.com");

        KitItemResponse item = kitService.guardar(usuario,
                new KitItemRequest(medicamentoId(0), 2, "caja nueva"));

        assertTrue(item.name() != null && !item.name().isBlank());
        assertEquals(2, item.quantity());
        assertEquals("caja nueva", item.notes());
        assertEquals(1, kitService.listar(usuario).size());
    }

    @Test
    @DisplayName("guardar dos veces el mismo medicamento actualiza, no duplica")
    void guardarEsUpsert() {
        User usuario = usuario("kit-upsert@medicore.com");
        Long medicamento = medicamentoId(0);

        kitService.guardar(usuario, new KitItemRequest(medicamento, 1, null));
        KitItemResponse segundo = kitService.guardar(usuario, new KitItemRequest(medicamento, 7, "repuesto"));

        assertEquals(7, segundo.quantity());
        assertEquals(1, kitService.listar(usuario).size(), "no debe duplicar el medicamento");
    }

    @Test
    @DisplayName("borra el medicamento del botiquin")
    void borraMedicamento() {
        User usuario = usuario("kit-borra@medicore.com");
        Long medicamento = medicamentoId(0);
        kitService.guardar(usuario, new KitItemRequest(medicamento, 1, null));

        assertTrue(kitService.borrar(usuario, medicamento));
        assertTrue(kitService.listar(usuario).isEmpty());
        assertFalse(kitService.borrar(usuario, medicamento), "ya no estaba");
    }

    @Test
    @DisplayName("un usuario no ve el botiquin de otro")
    void aislamientoEntreUsuarios() {
        User dueno = usuario("kit-dueno@medicore.com");
        User otro = usuario("kit-otro@medicore.com");
        Long medicamento = medicamentoId(0);

        kitService.guardar(dueno, new KitItemRequest(medicamento, 3, "solo mia"));

        assertTrue(kitService.listar(otro).isEmpty(), "el otro usuario no ve nada");
        assertTrue(kitService.buscar(otro, medicamento).isEmpty(), "ni por id de medicamento");
        assertFalse(kitService.borrar(otro, medicamento), "no puede borrar lo ajeno");

        assertEquals(1, kitService.listar(dueno).size(), "el dueno conserva su item");
    }

    @Test
    @DisplayName("un medicamento inexistente se rechaza")
    void medicamentoInexistente() {
        User usuario = usuario("kit-inexistente@medicore.com");

        IllegalArgumentException error = assertThrows(IllegalArgumentException.class,
                () -> kitService.guardar(usuario, new KitItemRequest(9_999_999L, 1, null)));

        assertTrue(error.getMessage().contains("no existe"));
    }

    @Test
    @DisplayName("la cantidad fuera de rango se rechaza")
    void cantidadFueraDeRango() {
        User usuario = usuario("kit-cantidad@medicore.com");
        Long medicamento = medicamentoId(0);

        assertThrows(IllegalArgumentException.class,
                () -> kitService.guardar(usuario, new KitItemRequest(medicamento, 0, null)));
        assertThrows(IllegalArgumentException.class,
                () -> kitService.guardar(usuario, new KitItemRequest(medicamento, 100, null)));
    }

    @Test
    @DisplayName("una nota demasiado larga se rechaza")
    void notaDemasiadoLarga() {
        User usuario = usuario("kit-nota@medicore.com");
        Long medicamento = medicamentoId(0);

        assertThrows(IllegalArgumentException.class,
                () -> kitService.guardar(usuario,
                        new KitItemRequest(medicamento, 1, "x".repeat(301))));
    }
}