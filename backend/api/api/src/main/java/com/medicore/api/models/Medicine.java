package com.medicore.api.models;

import java.util.ArrayList;
import java.util.List;


import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Table;

/**
 * Medicamento del catalogo. Los datos viven en la base de datos;
 * el controlador nunca los tiene escritos a mano.
 */
@Entity
@Table(name = "medicine")
public class Medicine {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 200)
    private String name;

    @Column(length = 120)
    private String category;

    /** Clase CSS de la categoria (ej. cat-analg), la usa el frontend. */
    @Column(length = 40)
    private String categoryClass;

    /** Presentacion / concentracion (ej. "500 mg"). */
    @Column(length = 120)
    private String dose;

    /** Para que sirve. */
    @Column(length = 2000)
    private String uses;

    /** Dosis habitual. */
    @Column(length = 2000)
    private String posology;

    /** Cuando tomarlo. */
    @Column(length = 2000)
    private String whenToTake;

    /** Precauciones: se guardan en la tabla hija medicine_precaution. */
    @ElementCollection
    @CollectionTable(name = "medicine_precaution", joinColumns = @JoinColumn(name = "medicine_id"))
    @Column(name = "precaution", length = 500)
    private List<String> precautions = new ArrayList<>();

    /** Consejo de Mol. */
    @Column(length = 2000)
    private String molTip;

    /** Emoji asociado (ej. un emoji de pastilla). */
    @Column(length = 16)
    private String emoji;

    public Medicine() {
    }

    public Medicine(String name, String category) {
        this.name = name;
        this.category = category;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public String getCategoryClass() { return categoryClass; }
    public void setCategoryClass(String categoryClass) { this.categoryClass = categoryClass; }

    public String getDose() { return dose; }
    public void setDose(String dose) { this.dose = dose; }

    public String getUses() { return uses; }
    public void setUses(String uses) { this.uses = uses; }

    public String getPosology() { return posology; }
    public void setPosology(String posology) { this.posology = posology; }

    public String getWhenToTake() { return whenToTake; }
    public void setWhenToTake(String whenToTake) { this.whenToTake = whenToTake; }

    public List<String> getPrecautions() { return precautions; }
    public void setPrecautions(List<String> precautions) { this.precautions = precautions; }

    public String getMolTip() { return molTip; }
    public void setMolTip(String molTip) { this.molTip = molTip; }

    public String getEmoji() { return emoji; }
    public void setEmoji(String emoji) { this.emoji = emoji; }
}