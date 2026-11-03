package com.medicore.api.services;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.List;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import com.medicore.api.models.Medicine;

/**
 * Pruebas de la capa de servicio SIN pasar por el controlador ni por HTTP.
 *
 * Usa el perfil "dev" (H2 en memoria + migraciones Flyway), asi que el catalogo
 * real se carga una vez y las busquedas se prueban contra datos verdaderos.
 */
@SpringBootTest
@ActiveProfiles("dev")
class MedicineServiceTest {

    @Autowired
    private MedicineService medicineService;

    @Test
    @DisplayName("sin filtros devuelve el catalogo completo")
    void devuelveTodoElCatalogo() {
        List<Medicine> todos = medicineService.search(null, null);

        assertEquals(medicineService.count(), todos.size());
        assertTrue(todos.size() > 100, "Flyway debe haber cargado el catalogo");
    }

    @Test
    @DisplayName("encuentra aunque el usuario escriba sin tildes ni mayusculas")
    void buscaIgnorandoTildesYMayusculas() {
        List<Medicine> resultado = medicineService.search("ACETAMINOFEN", null);

        assertFalse(resultado.isEmpty(), "debe encontrar 'Acetaminofén'");
        assertTrue(resultado.stream().anyMatch(m -> "Acetaminofén".equals(m.getName())));
    }

    @Test
    @DisplayName("busca por nombre parcial")
    void buscaPorNombreParcial() {
        List<Medicine> resultado = medicineService.search("ibupro", null);

        assertFalse(resultado.isEmpty());
        assertTrue(resultado.stream().anyMatch(m -> m.getName().startsWith("Ibuprofeno")));
    }

    @Test
    @DisplayName("busca tambien dentro de 'para que sirve'")
    void buscaEnElUso() {
        List<Medicine> resultado = medicineService.search("fiebre", null);

        assertFalse(resultado.isEmpty());
        assertTrue(resultado.stream().anyMatch(m -> "Acetaminofén".equals(m.getName())));
    }

    @Test
    @DisplayName("una busqueda sin coincidencias devuelve lista vacia, no error")
    void busquedaSinResultados() {
        assertTrue(medicineService.search("zzzznoexiste", null).isEmpty());
    }

    @Test
    @DisplayName("filtra por categoria exacta")
    void filtraPorCategoria() {
        List<Medicine> vitaminas = medicineService.search(null, "Vitamina");

        assertFalse(vitaminas.isEmpty());
        assertTrue(vitaminas.stream().allMatch(m -> "Vitamina".equals(m.getCategory())));
    }

    @Test
    @DisplayName("'all' equivale a no filtrar")
    void categoriaAllNoFiltra() {
        assertEquals(
                medicineService.search(null, null).size(),
                medicineService.search(null, "all").size());
    }

    @Test
    @DisplayName("categoria inexistente lanza IllegalArgumentException")
    void categoriaInvalida() {
        IllegalArgumentException error = assertThrows(IllegalArgumentException.class,
                () -> medicineService.search(null, "CategoriaQueNoExiste"));

        assertTrue(error.getMessage().contains("no existe"));
    }

    @Test
    @DisplayName("busqueda demasiado larga se rechaza")
    void busquedaDemasiadoLarga() {
        String larga = "a".repeat(101);

        assertThrows(IllegalArgumentException.class, () -> medicineService.search(larga, null));
    }

    @Test
    @DisplayName("busqueda y categoria se combinan")
    void busquedaYCategoriaCombinadas() {
        List<Medicine> resultado = medicineService.search("dolor", "Vitamina");

        assertTrue(resultado.stream().allMatch(m -> "Vitamina".equals(m.getCategory())));
    }

    @Test
    @DisplayName("getById devuelve el medicamento existente")
    void getByIdExistente() {
        assertTrue(medicineService.getById(1L).isPresent());
    }

    @Test
    @DisplayName("getById valida el id")
    void getByIdValidaId() {
        assertThrows(IllegalArgumentException.class, () -> medicineService.getById(0L));
        assertThrows(IllegalArgumentException.class, () -> medicineService.getById(null));
    }

    @Test
    @DisplayName("getById inexistente devuelve Optional vacio")
    void getByIdInexistente() {
        assertTrue(medicineService.getById(9_999_999L).isEmpty());
    }

    @Test
    @DisplayName("las categorias son las del catalogo")
    void devuelveCategorias() {
        List<String> categorias = medicineService.getCategories();

        assertNotNull(categorias);
        assertEquals(9, categorias.size());
        assertTrue(categorias.contains("Analgésico"));
        assertTrue(categorias.contains("Antidiabético"), "incluye la categoria que faltaba en el frontend");
    }
}
