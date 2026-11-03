package com.medicore.api.services;

import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.medicore.api.models.Medicine;
import com.medicore.api.repositories.MedicineRepository;

/**
 * Logica de negocio de medicamentos.
 * Ya no hay ninguna lista en memoria: todo se consulta a la base de datos.
 */
@Service
@Transactional(readOnly = true)
public class MedicineService {

    private final MedicineRepository medicineRepository;

    public MedicineService(MedicineRepository medicineRepository) {
        this.medicineRepository = medicineRepository;
    }

    public List<Medicine> getMedicines(String search, String category) {
        boolean hasSearch = search != null && !search.isBlank();
        boolean hasCategory = category != null && !category.isBlank();

        if (hasSearch && hasCategory) {
            return medicineRepository.findByCategoryIgnoreCaseOrderByNameAsc(category).stream()
                    .filter(m -> contains(m.getName(), search) || contains(m.getCategory(), search))
                    .toList();
        }
        if (hasSearch) {
            return medicineRepository
                    .findByNameContainingIgnoreCaseOrCategoryContainingIgnoreCaseOrderByNameAsc(search, search);
        }
        if (hasCategory) {
            return medicineRepository.findByCategoryIgnoreCaseOrderByNameAsc(category);
        }
        return medicineRepository.findAll(org.springframework.data.domain.Sort.by("name"));
    }

    public Optional<Medicine> getById(Long id) {
        return medicineRepository.findById(id);
    }

    public List<String> getCategories() {
        return medicineRepository.findDistinctCategories();
    }

    public long count() {
        return medicineRepository.count();
    }

    private boolean contains(String value, String search) {
        return value != null && value.toLowerCase().contains(search.toLowerCase());
    }
}