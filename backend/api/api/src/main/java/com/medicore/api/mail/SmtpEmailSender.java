package com.medicore.api.mail;

import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;

public class SmtpEmailSender implements EmailSender {

    private final JavaMailSender mailSender;
    private final String remitente;
    private final String nombreRemitente;

    public SmtpEmailSender(JavaMailSender mailSender, String remitente, String nombreRemitente) {
        this.mailSender = mailSender;
        this.remitente = remitente;
        this.nombreRemitente = nombreRemitente;
    }

    @Override
    public void send(EmailMessage mensaje) {
        try {
            MimeMessage correo = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(correo, true, "UTF-8");

            helper.setFrom(remitente, nombreRemitente);
            helper.setTo(mensaje.to());
            helper.setSubject(mensaje.subject());
            helper.setText(mensaje.textBody(), mensaje.htmlBody());

            mailSender.send(correo);
        } catch (MessagingException | java.io.UnsupportedEncodingException error) {
            throw new IllegalStateException("No se pudo preparar el correo: " + error.getMessage(), error);
        }
    }
}