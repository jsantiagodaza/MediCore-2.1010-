package com.medicore.api.services;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.medicore.api.dto.NotificationDeliveryResponse;
import com.medicore.api.dto.NotificationDispatchResponse;
import com.medicore.api.mail.EmailMessage;
import com.medicore.api.mail.EmailSender;
import com.medicore.api.mail.EmailTemplateRenderer;
import com.medicore.api.models.AlertPreference;
import com.medicore.api.models.DeliveryStatus;
import com.medicore.api.models.NotificationDelivery;
import com.medicore.api.models.RiskLevel;
import com.medicore.api.models.SeasonAlert;
import com.medicore.api.models.User;
import com.medicore.api.repositories.AlertPreferenceRepository;
import com.medicore.api.repositories.NotificationDeliveryRepository;

import jakarta.mail.internet.AddressException;
import jakarta.mail.internet.InternetAddress;

@Service
public class AlertNotificationService {

    private static final Logger log = LoggerFactory.getLogger(AlertNotificationService.class);

    private static final String PLANTILLA_HTML = "alert-notification.html";
    private static final String PLANTILLA_TEXTO = "alert-notification.txt";

    private final AlertPreferenceRepository preferenceRepository;
    private final NotificationDeliveryRepository deliveryRepository;
    private final AlertService alertService;
    private final EmailTemplateRenderer renderer;
    private final ObjectProvider<EmailSender> senderProvider;
    private final boolean habilitado;
    private final int maxIntentos;
    private final long esperaMs;

    public AlertNotificationService(AlertPreferenceRepository preferenceRepository,
                                    NotificationDeliveryRepository deliveryRepository,
                                    AlertService alertService,
                                    EmailTemplateRenderer renderer,
                                    ObjectProvider<EmailSender> senderProvider,
                                    @Value("${app.mail.enabled:false}") boolean habilitado,
                                    @Value("${app.mail.max-attempts:3}") int maxIntentos,
                                    @Value("${app.mail.retry-delay-ms:1500}") long esperaMs) {
        this.preferenceRepository = preferenceRepository;
        this.deliveryRepository = deliveryRepository;
        this.alertService = alertService;
        this.renderer = renderer;
        this.senderProvider = senderProvider;
        this.habilitado = habilitado;
        this.maxIntentos = Math.max(1, maxIntentos);
        this.esperaMs = Math.max(0, esperaMs);
    }

    @Transactional
    public NotificationDispatchResponse dispatchFor(User usuario) {
        if (!habilitado) {
            return NotificationDispatchResponse.deshabilitado();
        }
        if (!correoValido(usuario.getEmail())) {
            return new NotificationDispatchResponse(0, 0, 0, 0,
                    "La cuenta no tiene un correo valido para notificar");
        }

        Optional<AlertPreference> preferencia = preferenceRepository.findByUser(usuario);
        if (preferencia.isEmpty() || !preferencia.get().isEnabled()) {
            return new NotificationDispatchResponse(0, 0, 0, 0,
                    "El usuario no tiene preferencias de alertas activas");
        }

        AlertPreference filtros = preferencia.get();
        List<SeasonAlert> alertas = alertService.search(
                filtros.getCity(),
                filtros.getRegion(),
                filtros.getCategory(),
                filtros.getRiskLevel() == null ? null : filtros.getRiskLevel().name(),
                Boolean.TRUE);

        int enviados = 0;
        int fallidos = 0;
        int omitidos = 0;
        int duplicados = 0;

        for (SeasonAlert alerta : alertas) {
            Optional<NotificationDelivery> previo =
                    deliveryRepository.findByUserAndAlert(usuario, alerta);

            if (previo.isPresent() && previo.get().getStatus() == DeliveryStatus.ENVIADO) {
                duplicados++;
                continue;
            }

            NotificationDelivery registro = previo.orElseGet(() ->
                    new NotificationDelivery(usuario, alerta, usuario.getEmail(), LocalDateTime.now()));

            NotificationDelivery resultado = enviar(usuario, alerta, registro);
            switch (resultado.getStatus()) {
                case ENVIADO -> enviados++;
                case FALLIDO -> fallidos++;
                case OMITIDO -> omitidos++;
            }
        }

        return new NotificationDispatchResponse(enviados, fallidos, omitidos, duplicados,
                "Alertas revisadas: " + alertas.size());
    }

    @Transactional(readOnly = true)
    public List<NotificationDeliveryResponse> historial(User usuario) {
        return deliveryRepository.findByUserOrderByCreatedAtDesc(usuario).stream()
                .map(NotificationDeliveryResponse::from)
                .toList();
    }

    private NotificationDelivery enviar(User usuario, SeasonAlert alerta, NotificationDelivery registro) {
        EmailSender sender = senderProvider.getIfAvailable();
        if (sender == null) {
            registro.omitir("No hay proveedor de correo configurado");
            return deliveryRepository.save(registro);
        }

        EmailMessage mensaje;
        try {
            mensaje = construirMensaje(usuario, alerta);
        } catch (RuntimeException error) {
            registro.omitir("No se pudo construir el correo: " + error.getMessage());
            return deliveryRepository.save(registro);
        }

        String ultimoError = null;
        for (int intento = 1; intento <= maxIntentos; intento++) {
            registro.setAttempts(intento);
            try {
                sender.send(mensaje);
                registro.marcarEnviado(LocalDateTime.now());
                log.info("Notificacion enviada a {} (alerta {}), intento {}",
                        usuario.getEmail(), alerta.getId(), intento);
                return deliveryRepository.save(registro);
            } catch (RuntimeException error) {
                ultimoError = error.getMessage();
                log.warn("Fallo el envio a {} (alerta {}), intento {}/{}: {}",
                        usuario.getEmail(), alerta.getId(), intento, maxIntentos, ultimoError);
                if (intento < maxIntentos) {
                    esperar();
                }
            }
        }

        registro.marcarFallido("Se agotaron los intentos: " + ultimoError);
        return deliveryRepository.save(registro);
    }

    private void esperar() {
        if (esperaMs <= 0) {
            return;
        }
        try {
            Thread.sleep(esperaMs);
        } catch (InterruptedException interrumpido) {
            Thread.currentThread().interrupt();
        }
    }

    private EmailMessage construirMensaje(User usuario, SeasonAlert alerta) {
        Map<String, String> valores = new HashMap<>();
        valores.put("nombre", nombre(usuario));
        valores.put("titulo", alerta.getTitle());
        valores.put("descripcion", alerta.getDescription());
        valores.put("categoria", alerta.getCategory());
        valores.put("riesgo", alerta.getRiskLevel().name());
        valores.put("riesgo_color", colorDe(alerta.getRiskLevel()));
        valores.put("ubicacion", ubicacion(alerta));
        valores.put("fuente", alerta.getSource() == null ? "MediCore" : alerta.getSource());
        valores.put("vigencia", vigencia(alerta));
        valores.put("anio", String.valueOf(LocalDate.now().getYear()));

        String asunto = "MediCore | Alerta de temporada: " + alerta.getTitle();

        return new EmailMessage(
                usuario.getEmail(),
                asunto,
                renderer.renderHtml(PLANTILLA_HTML, valores),
                renderer.renderText(PLANTILLA_TEXTO, valores));
    }

    private String nombre(User usuario) {
        return usuario.getName() == null || usuario.getName().isBlank()
                ? "usuario de MediCore"
                : usuario.getName().trim();
    }

    private String ubicacion(SeasonAlert alerta) {
        if (alerta.getCity() == null || alerta.getCity().isBlank()) {
            return alerta.getRegion();
        }
        return alerta.getCity() + ", " + alerta.getRegion();
    }

    private String vigencia(SeasonAlert alerta) {
        String desde = alerta.getStartsOn() == null ? "" : alerta.getStartsOn().toString();
        String hasta = alerta.getEndsOn() == null ? "sin fecha de cierre" : alerta.getEndsOn().toString();
        return desde + " a " + hasta;
    }

    private String colorDe(RiskLevel nivel) {
        return switch (nivel) {
            case BAJO -> "#059669";
            case MEDIO -> "#d97706";
            case ALTO -> "#ea580c";
            case CRITICO -> "#b91c1c";
        };
    }

    private boolean correoValido(String correo) {
        if (correo == null || correo.isBlank()) {
            return false;
        }
        try {
            InternetAddress direccion = new InternetAddress(correo.trim(), true);
            direccion.validate();
            return direccion.getAddress().equalsIgnoreCase(correo.trim())
                    || direccion.getAddress().equals(correo.trim());
        } catch (AddressException error) {
            return false;
        }
    }
}