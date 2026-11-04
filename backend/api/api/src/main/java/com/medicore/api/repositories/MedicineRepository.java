package com.medicore.api.repositories;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.medicore.api.models.Medicine;

@Repository
public interface MedicineRepository extends JpaRepository<Medicine, Long> {

    /** Busqueda por nombre o categoria (contiene, sin distinguir mayusculas). */
    List<Medicine> findByNameContainingIgnoreCaseOrCategoryContainingIgnoreCaseOrderByNameAsc(
            String name, String category);

    /** Filtro por categoria exacta. */
    List<Medicine> findByCategoryIgnoreCaseOrderByNameAsc(String category);

    Optional<Medicine> findByNameIgnoreCase(String name);

    boolean existsByNameIgnoreCase(String name);

    /** Categorias distintas, para los filtros del frontend. */
    @org.springframework.data.jpa.repository.Query(
            "select distinct m.category from Medicine m where m.category is not null order by m.category")
    List<String> findDistinctCategories();
}