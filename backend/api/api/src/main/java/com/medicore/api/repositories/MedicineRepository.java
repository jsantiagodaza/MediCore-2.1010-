package com.medicore.api.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.medicore.api.models.Medicine;

@Repository
public interface MedicineRepository extends JpaRepository<Medicine, Long> {
    // Por ahora se queda vacía. Heredar JpaRepository ya te da todo el poder básico.
}