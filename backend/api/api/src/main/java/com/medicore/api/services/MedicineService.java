package com.medicore.api.services;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.medicore.api.models.Medicine;

@Service // Le dice a Spring que esta clase maneja la lógica del negocio
public class MedicineService {

    // Lista en memoria para simular una base de datos temporal
    private final List<Medicine> temporaryDatabase = new ArrayList<>();

    // Este constructor se ejecuta apenas corre el programa y llena datos de prueba
    public MedicineService() {
        temporaryDatabase.add(new Medicine(1L, "Ibuprofeno", "Analgésico y antiinflamatorio", "Analgésicos"));
        temporaryDatabase.add(new Medicine(2L, "Acetaminofén", "Alivio del dolor y la fiebre", "Analgésicos"));
        temporaryDatabase.add(new Medicine(3L, "Amoxicilina", "Antibiótico para infecciones", "Antibióticos"));
        temporaryDatabase.add(new Medicine(4L, "Loratadina", "Antihistamínico para alergias", "Antihistamínicos"));
    }

    // Método para retornar toda la lista
    public List<Medicine> getAllMedicines() {
        return temporaryDatabase;
    }

    // Método para filtrar la lista según lo que escriba el usuario en el buscador
    public List<Medicine> searchMedicines(String query) {
        return temporaryDatabase.stream()
                .filter(m -> m.getName().toLowerCase().contains(query.toLowerCase()) 
                          || m.getCategory().toLowerCase().contains(query.toLowerCase()))
                .collect(Collectors.toList());
    }
}
