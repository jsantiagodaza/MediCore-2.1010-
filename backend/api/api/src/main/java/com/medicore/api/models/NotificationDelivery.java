package com.medicore.api.models;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "notification_delivery")
public class NotificationDelivery {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "alert_id", nullable = false)
    private SeasonAlert alert;

    @Column(nullable = false, length = 255)
    private String recipient;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private DeliveryStatus status;

    @Column(nullable = false)
    private int attempts;

    @Column(name = "error_message", length = 500)
    private String errorMessage;

    @Column(name = "sent_at")
    private LocalDateTime sentAt;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    public NotificationDelivery() {
    }

    public NotificationDelivery(User user, SeasonAlert alert, String recipient, LocalDateTime createdAt) {
        this.user = user;
        this.alert = alert;
        this.recipient = recipient;
        this.status = DeliveryStatus.OMITIDO;
        this.attempts = 0;
        this.createdAt = createdAt;
    }

    public void marcarEnviado(LocalDateTime fecha) {
        this.status = DeliveryStatus.ENVIADO;
        this.sentAt = fecha;
        this.errorMessage = null;
    }

    public void marcarFallido(String motivo) {
        this.status = DeliveryStatus.FALLIDO;
        this.errorMessage = recortar(motivo);
    }

    public void omitir(String motivo) {
        this.status = DeliveryStatus.OMITIDO;
        this.errorMessage = recortar(motivo);
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

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public SeasonAlert getAlert() { return alert; }
    public void setAlert(SeasonAlert alert) { this.alert = alert; }

    public String getRecipient() { return recipient; }
    public void setRecipient(String recipient) { this.recipient = recipient; }

    public DeliveryStatus getStatus() { return status; }
    public void setStatus(DeliveryStatus status) { this.status = status; }

    public int getAttempts() { return attempts; }
    public void setAttempts(int attempts) { this.attempts = attempts; }

    public String getErrorMessage() { return errorMessage; }
    public void setErrorMessage(String errorMessage) { this.errorMessage = errorMessage; }

    public LocalDateTime getSentAt() { return sentAt; }
    public void setSentAt(LocalDateTime sentAt) { this.sentAt = sentAt; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}