package com.medicore.api.models;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;

@Entity // Le dice a Spring que esto será una tabla en PostgreSQL más adelante
public class Medicine {
    @Id // Define que este campo es la llave primaria
    @GeneratedValue(strategy = GenerationType.IDENTITY) // ID autoincremental
    private Long id;
    private String name;
    private String description;
    private String category;

    // Constructor vacío (Obligatorio para que Spring funcione bien)
    public Medicine() {}

    // Constructor con parámetros (Nos sirve para crear los datos de prueba rápido)
    public Medicine(Long id, String name, String description, String category) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.category = category;
    }

    // Getters y Setters (Permiten leer y modificar las propiedades desde otras capas)
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
}