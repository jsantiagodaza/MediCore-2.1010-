package com.medicore.api.controllers;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestAttribute;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.medicore.api.dto.NotificationDeliveryResponse;
import com.medicore.api.dto.NotificationDispatchResponse;
import com.medicore.api.models.User;
import com.medicore.api.security.AuthTokenInterceptor;
import com.medicore.api.services.AlertNotificationService;

@RestController
@RequestMapping("/api/v1/me/alert-notifications")
public class AlertNotificationController {

    private final AlertNotificationService notificationService;

    public AlertNotificationController(AlertNotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @PostMapping
    public NotificationDispatchResponse enviar(
            @RequestAttribute(AuthTokenInterceptor.USUARIO_ATRIBUTO) User usuario) {

        return notificationService.dispatchFor(usuario);
    }

    @GetMapping
    public List<NotificationDeliveryResponse> historial(
            @RequestAttribute(AuthTokenInterceptor.USUARIO_ATRIBUTO) User usuario) {

        return notificationService.historial(usuario);
    }
}