package com.medicore.api.services;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.medicore.api.dto.KitItemRequest;
import com.medicore.api.dto.KitItemResponse;
import com.medicore.api.models.KitItem;
import com.medicore.api.models.Medicine;
import com.medicore.api.models.User;
import com.medicore.api.repositories.KitItemRepository;
import com.medicore.api.repositories.MedicineRepository;

@Service
@Transactional
public class KitService {

    private static final int MAX_NOTA = 300;
    private static final int MIN_CANTIDAD = 1;
    private static final int MAX_CANTIDAD = 99;

    private final KitItemRepository kitRepository;
    private final MedicineRepository medicineRepository;

    public KitService(KitItemRepository kitRepository, MedicineRepository medicineRepository) {
        this.kitRepository = kitRepository;
        this.medicineRepository = medicineRepository;
    }

    @Transactional(readOnly = true)
    public List<KitItemResponse> listar(User usuario) {
        return kitRepository.findByUserOrderByMedicineNameAsc(usuario).stream()
                .map(KitItemResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public Optional<KitItemResponse> buscar(User usuario, Long medicineId) {
        Medicine medicamento = medicamento(medicineId);
        return kitRepository.findByUserAndMedicine(usuario, medicamento).map(KitItemResponse::from);
    }

    public KitItemResponse guardar(User usuario, KitItemRequest peticion) {
        Medicine medicamento = medicamento(peticion.getMedicineId());
        int cantidad = validarCantidad(peticion.getQuantity());
        String nota = limpiarNota(peticion.getNotes());
        LocalDateTime ahora = LocalDateTime.now();

        KitItem item = kitRepository.findByUserAndMedicine(usuario, medicamento)
                .orElseGet(() -> new KitItem(usuario, medicamento, cantidad, nota, ahora));

        item.setQuantity(cantidad);
        item.setNotes(nota);
        item.setUpdatedAt(ahora);

        return KitItemResponse.from(kitRepository.save(item));
    }

    public boolean borrar(User usuario, Long medicineId) {
        Medicine medicamento = medicamento(medicineId);
        return kitRepository.findByUserAndMedicine(usuario, medicamento)
                .map(item -> {
                    kitRepository.delete(item);
                    return true;
                })
                .orElse(false);
    }

    private Medicine medicamento(Long medicineId) {
        if (medicineId == null || medicineId <= 0) {
            throw new IllegalArgumentException("El id del medicamento debe ser un numero positivo");
        }
        return medicineRepository.findById(medicineId)
                .orElseThrow(() -> new IllegalArgumentException(
                        "El medicamento no existe en el catalogo"));
    }

    private int validarCantidad(Integer quantity) {
        if (quantity == null) {
            return MIN_CANTIDAD;
        }
        if (quantity < MIN_CANTIDAD || quantity > MAX_CANTIDAD) {
            throw new IllegalArgumentException("La cantidad debe estar entre "
                    + MIN_CANTIDAD + " y " + MAX_CANTIDAD);
        }
        return quantity;
    }

    private String limpiarNota(String notes) {
        if (notes == null || notes.isBlank()) {
            return null;
        }
        String limpio = notes.trim();
        if (limpio.length() > MAX_NOTA) {
            throw new IllegalArgumentException("La nota no puede superar " + MAX_NOTA + " caracteres");
        }
        return limpio;
    }
}