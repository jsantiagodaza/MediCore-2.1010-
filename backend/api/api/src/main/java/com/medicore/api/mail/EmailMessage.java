package com.medicore.api.mail;

public record EmailMessage(String to, String subject, String htmlBody, String textBody) {
}