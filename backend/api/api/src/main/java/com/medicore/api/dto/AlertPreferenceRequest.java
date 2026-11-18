package com.medicore.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class AlertPreferenceRequest {

    @Size(max = 120, message = "La ciudad no puede superar 120 caracteres")
    private String city;

    @Size(max = 120, message = "La region no puede superar 120 caracteres")
    private String region;

    @Size(max = 80, message = "La categoria no puede superar 80 caracteres")
    private String category;

    @NotBlank(message = "El nivel de riesgo es obligatorio")
    @Size(max = 20, message = "El nivel de riesgo no puede superar 20 caracteres")
    private String riskLevel;

    private Boolean enabled;

    public AlertPreferenceRequest() {
    }

    public AlertPreferenceRequest(String city, String region, String category,
                                  String riskLevel, Boolean enabled) {
        this.city = city;
        this.region = region;
        this.category = category;
        this.riskLevel = riskLevel;
        this.enabled = enabled;
    }

    public String getCity() { return city; }
    public void setCity(String city) { this.city = city; }

    public String getRegion() { return region; }
    public void setRegion(String region) { this.region = region; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public String getRiskLevel() { return riskLevel; }
    public void setRiskLevel(String riskLevel) { this.riskLevel = riskLevel; }

    public Boolean getEnabled() { return enabled; }
    public void setEnabled(Boolean enabled) { this.enabled = enabled; }
}