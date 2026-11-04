package com.medicore.api.controllers;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.medicore.api.models.Medicine;
import com.medicore.api.services.MedicineService;

/**
 * Controlador delgado: recibe la peticion, delega en el servicio y devuelve
 * la respuesta. La busqueda, la normalizacion, los filtros y las validaciones
 * viven en {@link MedicineService}.
 */
@RestController
@RequestMapping("/api/v1/medicines")
public class MedicineController {

    private final MedicineService medicineService;

    public MedicineController(MedicineService medicineService) {
        this.medicineService = medicineService;
    }

    /** GET /api/v1/medicines?search=acetaminofen&category=Analgesico */
    @GetMapping
    public List<Medicine> getMedicines(
            @RequestParam(value = "search", required = false) String search,
            @RequestParam(value = "category", required = false) String category) {
        return medicineService.search(search, category);
    }

    /** GET /api/v1/medicines/categories -> ["Analgesico", "Antibiotico", ...] */
    @GetMapping("/categories")
    public List<String> getCategories() {
        return medicineService.getCategories();
    }

    /** GET /api/v1/medicines/12 */
    @GetMapping("/{id}")
    public ResponseEntity<Medicine> getById(@PathVariable Long id) {
        return medicineService.getById(id)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }
}
