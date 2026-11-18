package com.medicore.api.services;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import com.medicore.api.dto.AlertPreferenceRequest;
import com.medicore.api.dto.NotificationDispatchResponse;
import com.medicore.api.mail.FakeEmailSender;
import com.medicore.api.mail.FakeMailConfiguration;
import com.medicore.api.models.DeliveryStatus;
import com.medicore.api.models.NotificationDelivery;
import com.medicore.api.models.User;
import com.medicore.api.repositories.NotificationDeliveryRepository;

@SpringBootTest(properties = {
        "app.mail.enabled=true",
        "app.mail.provider=fake",
        "app.mail.max-attempts=2",
        "app.mail.retry-delay-ms=0"
})
@ActiveProfiles("dev")
@Transactional
@Import(FakeMailConfiguration.class)
class AlertNotificationServiceTest {

    private static final String PASSWORD = "Contrasena123";

    @Autowired
    private AlertNotificationService notificationService;

    @Autowired
    private AlertPreferenceService preferenceService;

    @Autowired
    private NotificationDeliveryRepository deliveryRepository;

    @Autowired
    private AuthService authService;

    @Autowired
    private FakeEmailSender fakeEmailSender;

    @BeforeEach
    void limpiarBandeja() {
        fakeEmailSender.reiniciar();
    }

    private User registrar(String email) {
        return authService.register(email, PASSWORD, "Prueba");
    }

    private void preferencias(User usuario, String ciudad, String region,
                              String categoria, String riesgo) {
        preferenceService.save(usuario,
                new AlertPreferenceRequest(ciudad, region, categoria, riesgo, true));
    }

    @Test
    @DisplayName("sin preferencias activas no envia nada")
    void sinPreferenciasNoEnvia() {
        User usuario = registrar("sin-preferencias@medicore.com");

        NotificationDispatchResponse respuesta = notificationService.dispatchFor(usuario);

        assertEquals(0, respuesta.enviados());
        assertTrue(respuesta.mensaje().contains("preferencias"));
        assertTrue(fakeEmailSender.enviados().isEmpty());
        assertTrue(notificationService.historial(usuario).isEmpty());
    }

    @Test
    @DisplayName("envia las alertas que coinciden con las preferencias")
    void enviaSegunPreferencias() {
        User usuario = registrar("envia@medicore.com");
        preferencias(usuario, null, "Cesar", null, "BAJO");

        NotificationDispatchResponse respuesta = notificationService.dispatchFor(usuario);

        assertTrue(respuesta.enviados() > 0, "debe enviar las alertas de riesgo BAJO en Cesar");
        assertEquals(respuesta.enviados(), fakeEmailSender.enviados().size());

        var mensaje = fakeEmailSender.enviados().get(0);
        assertEquals(usuario.getEmail(), mensaje.to());
        assertTrue(mensaje.subject().contains("MediCore"));
        assertTrue(mensaje.htmlBody().contains("MediCore"), "la plantilla lleva la identidad");
        assertTrue(mensaje.textBody().contains("MediCore"));
    }

    @Test
    @DisplayName("las preferencias sin coincidencias no envian correos")
    void preferenciasSinCoincidencias() {
        User usuario = registrar("sin-alertas@medicore.com");
        preferencias(usuario, null, "Amazonas", null, "ALTO");

        NotificationDispatchResponse respuesta = notificationService.dispatchFor(usuario);

        assertEquals(0, respuesta.enviados());
        assertTrue(fakeEmailSender.enviados().isEmpty());
    }

    @Test
    @DisplayName("una alerta ya enviada no se vuelve a enviar")
    void noDuplicaEnvios() {
        User usuario = registrar("duplicado@medicore.com");
        preferencias(usuario, null, "Cesar", null, "BAJO");

        NotificationDispatchResponse primera = notificationService.dispatchFor(usuario);
        int enviadosPrimeraVez = primera.enviados();
        int correosPrimeraVez = fakeEmailSender.enviados().size();

        NotificationDispatchResponse segunda = notificationService.dispatchFor(usuario);

        assertEquals(0, segunda.enviados());
        assertEquals(enviadosPrimeraVez, segunda.duplicados());
        assertEquals(correosPrimeraVez, fakeEmailSender.enviados().size());
    }

    @Test
    @DisplayName("si el proveedor falla se reintenta y queda registrado el error")
    void registraFalloDespuesDeReintentos() {
        User usuario = registrar("falla@medicore.com");
        preferencias(usuario, null, "Cesar", null, "BAJO");
        fakeEmailSender.fallarSiempre("SMTP caido");

        NotificationDispatchResponse respuesta = notificationService.dispatchFor(usuario);

        assertTrue(respuesta.fallidos() > 0);
        assertEquals(0, respuesta.enviados());
        assertTrue(fakeEmailSender.enviados().isEmpty());

        List<NotificationDelivery> registros = deliveryRepository.findByUserOrderByCreatedAtDesc(usuario);
        assertFalse(registros.isEmpty());
        assertTrue(registros.stream().allMatch(r -> r.getStatus() == DeliveryStatus.FALLIDO));
        assertTrue(registros.stream().allMatch(r -> r.getAttempts() == 2), "agota los 2 intentos");
        assertTrue(registros.stream().allMatch(r -> r.getErrorMessage().contains("SMTP caido")));
    }

    @Test
    @DisplayName("un envio fallido si se reintenta en la siguiente ejecucion")
    void reintentaEnvioFallido() {
        User usuario = registrar("reintenta@medicore.com");
        preferencias(usuario, null, "Cesar", null, "BAJO");

        fakeEmailSender.fallarSiempre("SMTP caido");
        NotificationDispatchResponse fallida = notificationService.dispatchFor(usuario);
        assertTrue(fallida.fallidos() > 0);

        fakeEmailSender.reiniciar();
        NotificationDispatchResponse reintento = notificationService.dispatchFor(usuario);

        assertEquals(fallida.fallidos(), reintento.enviados(), "los fallidos se reenvian");
        assertEquals(0, reintento.duplicados());

        List<NotificationDelivery> registros = deliveryRepository.findByUserOrderByCreatedAtDesc(usuario);
        assertTrue(registros.stream().allMatch(r -> r.getStatus() == DeliveryStatus.ENVIADO));
    }
}