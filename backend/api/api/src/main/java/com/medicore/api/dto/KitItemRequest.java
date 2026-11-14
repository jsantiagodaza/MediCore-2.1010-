package com.medicore.api.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

public class KitItemRequest {

    @NotNull(message = "El medicamento es obligatorio")
    @Positive(message = "El medicamento no es valido")
    private Long medicineId;

    @Min(value = 1, message = "La cantidad debe ser al menos 1")
    @Max(value = 99, message = "La cantidad no puede superar 99")
    private Integer quantity;

    @Size(max = 300, message = "La nota no puede superar 300 caracteres")
    private String notes;

    public KitItemRequest() {
    }

    public KitItemRequest(Long medicineId, Integer quantity, String notes) {
        this.medicineId = medicineId;
        this.quantity = quantity;
        this.notes = notes;
    }

    public Long getMedicineId() { return medicineId; }
    public void setMedicineId(Long medicineId) { this.medicineId = medicineId; }

    public Integer getQuantity() { return quantity; }
    public void setQuantity(Integer quantity) { this.quantity = quantity; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
}