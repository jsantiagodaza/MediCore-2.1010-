package com.medicore.api.services;

import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.medicore.api.models.Medicine;
import com.medicore.api.repositories.MedicineRepository;
import com.medicore.api.utils.TextNormalizer;

/**
 * Capa de servicio del catalogo de medicamentos.
 *
 * Aqui viven la busqueda, el filtro por categoria, la normalizacion del texto
 * y las validaciones. El controlador solo recibe la peticion y devuelve la
 * respuesta; no decide nada de negocio.
 *
 * El servicio no depende de la capa web: se puede probar con una base de datos
 * de test o con un repositorio simulado.
 */
@Service
@Transactional(readOnly = true)
public class MedicineService {

    /** Limite defensivo para no recibir busquedas gigantes. */
    private static final int MAX_SEARCH_LENGTH = 100;

    /** Valor que el frontend usa para "sin filtro de categoria". */
    private static final String TODAS_LAS_CATEGORIAS = "all";

    private final MedicineRepository medicineRepository;

    public MedicineService(MedicineRepository medicineRepository) {
        this.medicineRepository = medicineRepository;
    }

    /**
     * Busca medicamentos por texto y/o categoria.
     *
     * - El texto se normaliza (sin tildes, minusculas), asi "acetaminofen"
     *   encuentra "Acetaminofén".
     * - Se busca en nombre, categoria y para que sirve.
     * - La categoria se valida contra las categorias existentes.
     *
     * @param search   texto a buscar (puede ser null o vacio)
     * @param category categoria exacta o "all"/null para todas
     * @return medicamentos ordenados por nombre
     * @throws IllegalArgumentException si el texto es demasiado largo o la
     *                                  categoria no existe
     */
    public List<Medicine> search(String search, String category) {
        String termino = normalizarTerminoBusqueda(search);
        String categoria = validarCategoria(category);

        List<Medicine> candidatos = (categoria == null)
                ? medicineRepository.findAll(Sort.by("name"))
                : medicineRepository.findByCategoryIgnoreCaseOrderByNameAsc(categoria);

        if (termino.isEmpty()) {
            return candidatos;
        }

        return candidatos.stream()
                .filter(m -> TextNormalizer.contains(m.getName(), termino)
                        || TextNormalizer.contains(m.getCategory(), termino)
                        || TextNormalizer.contains(m.getUses(), termino))
                .toList();
    }

    /**
     * @param id identificador del medicamento
     * @return el medicamento si existe
     * @throws IllegalArgumentException si el id no es valido
     */
    public Optional<Medicine> getById(Long id) {
        if (id == null || id <= 0) {
            throw new IllegalArgumentException("El id del medicamento debe ser un numero positivo");
        }
        return medicineRepository.findById(id);
    }

    /** Categorias disponibles para los filtros. */
    public List<String> getCategories() {
        return medicineRepository.findDistinctCategories();
    }

    /** Total de medicamentos en el catalogo. */
    public long count() {
        return medicineRepository.count();
    }

    // ------------------------------------------------------------------
    //  Validacion y normalizacion (parte de la logica de negocio)
    // ------------------------------------------------------------------

    private String normalizarTerminoBusqueda(String search) {
        if (search == null) {
            return "";
        }
        String limpio = search.trim();
        if (limpio.length() > MAX_SEARCH_LENGTH) {
            throw new IllegalArgumentException(
                    "La busqueda no puede superar " + MAX_SEARCH_LENGTH + " caracteres");
        }
        return TextNormalizer.normalize(limpio);
    }

    /**
     * @return el nombre canonico de la categoria, o null si no se filtra
     */
    private String validarCategoria(String category) {
        if (category == null || category.isBlank()
                || TODAS_LAS_CATEGORIAS.equalsIgnoreCase(category.trim())) {
            return null;
        }
        String solicitada = category.trim();
        return medicineRepository.findDistinctCategories().stream()
                .filter(c -> c.equalsIgnoreCase(solicitada))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException(
                        "La categoria '" + solicitada + "' no existe en el catalogo"));
    }
}
