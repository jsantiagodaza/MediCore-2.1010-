package com.medicore.api.controllers;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.medicore.api.models.Medicine;
import com.medicore.api.services.MedicineService;

@RestController
@RequestMapping("/api/v1/medicines")
public class MedicineController {

    private final MedicineService medicineService;

    // Inyección de dependencias: Traemos el servicio para usar sus funciones
    public MedicineController(MedicineService medicineService) {
        this.medicineService = medicineService;
    }

    @GetMapping
    public List<Medicine> getMedicines(@RequestParam(value = "search", required = false) String search) {
        // Si el usuario usó el buscador (ej: ?search=Ibuprofeno)
        if (search != null && !search.isEmpty()) {
            return medicineService.searchMedicines(search);
        }
        // Si no buscó nada, mandamos la lista completa
        return medicineService.getAllMedicines();
    }
}
