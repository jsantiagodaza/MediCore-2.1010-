package com.medicore.api.mail;

import java.util.ArrayList;
import java.util.List;

public class FakeEmailSender implements EmailSender {

    private final List<EmailMessage> enviados = new ArrayList<>();
    private int fallosRestantes;
    private String motivoError = "Fallo simulado del proveedor de correo";

    @Override
    public void send(EmailMessage mensaje) {
        if (fallosRestantes > 0) {
            fallosRestantes--;
            throw new IllegalStateException(motivoError);
        }
        enviados.add(mensaje);
    }

    public List<EmailMessage> enviados() {
        return enviados;
    }

    public void fallarSiempre(String motivo) {
        this.motivoError = motivo;
        this.fallosRestantes = Integer.MAX_VALUE;
    }

    public void fallarLasSiguientes(int veces) {
        this.fallosRestantes = veces;
    }

    public void reiniciar() {
        enviados.clear();
        fallosRestantes = 0;
        motivoError = "Fallo simulado del proveedor de correo";
    }
}