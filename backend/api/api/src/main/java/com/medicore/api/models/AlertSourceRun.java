package com.medicore.api.models;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "alert_source_run")
public class AlertSourceRun {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "source_id", nullable = false, length = 80)
    private String sourceId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private SourceRunStatus status;

    @Column(name = "alerts_imported", nullable = false)
    private int alertsImported;

    @Column(name = "error_message", length = 500)
    private String errorMessage;

    @Column(name = "started_at", nullable = false)
    private LocalDateTime startedAt;

    @Column(name = "finished_at")
    private LocalDateTime finishedAt;

    public AlertSourceRun() {
    }

    public AlertSourceRun(String sourceId, LocalDateTime startedAt) {
        this.sourceId = sourceId;
        this.startedAt = startedAt;
        this.status = SourceRunStatus.ERROR;
        this.alertsImported = 0;
    }

    public void terminarOk(int importadas) {
        this.status = SourceRunStatus.OK;
        this.alertsImported = importadas;
        this.errorMessage = null;
        this.finishedAt = LocalDateTime.now();
    }

    public void terminarConError(String motivo) {
        this.status = SourceRunStatus.ERROR;
        this.errorMessage = recortar(motivo);
        this.finishedAt = LocalDateTime.now();
    }

    private String recortar(String texto) {
        if (texto == null) {
            return null;
        }
        String limpio = texto.replace('\n', ' ').replace('\r', ' ').trim();
        return limpio.length() > 500 ? limpio.substring(0, 500) : limpio;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getSourceId() { return sourceId; }
    public void setSourceId(String sourceId) { this.sourceId = sourceId; }

    public SourceRunStatus getStatus() { return status; }
    public void setStatus(SourceRunStatus status) { this.status = status; }

    public int getAlertsImported() { return alertsImported; }
    public void setAlertsImported(int alertsImported) { this.alertsImported = alertsImported; }

    public String getErrorMessage() { return errorMessage; }
    public void setErrorMessage(String errorMessage) { this.errorMessage = errorMessage; }

    public LocalDateTime getStartedAt() { return startedAt; }
    public void setStartedAt(LocalDateTime startedAt) { this.startedAt = startedAt; }

    public LocalDateTime getFinishedAt() { return finishedAt; }
    public void setFinishedAt(LocalDateTime finishedAt) { this.finishedAt = finishedAt; }
}