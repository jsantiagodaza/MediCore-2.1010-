package com.medicore.api.controllers;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;

import org.springframework.dao.DataAccessException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * GET /api/v1/health/db
 *
 * Ejecuta SELECT 1 contra la base configurada en el perfil activo.
 * 200 + database=UP   cuando responde
 * 503 + database=DOWN cuando no responde (con el motivo saneado, sin credenciales)
 */
@RestController
@RequestMapping("/api/v1/health")
public class DbHealthController {

    private final JdbcTemplate jdbcTemplate;

    public DbHealthController(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @GetMapping("/db")
    public ResponseEntity<Map<String, Object>> db() {
        long start = System.nanoTime();
        try {
            jdbcTemplate.queryForObject("SELECT 1", Integer.class);

            String version = queryOrNull("SELECT version()");
            if (version == null) {
                version = queryOrNull("SELECT h2version()"); // perfil dev
            }
            String databaseName = queryOrNull("SELECT current_database()");
            String user = queryOrNull("SELECT current_user");
            long latencyMs = (System.nanoTime() - start) / 1_000_000;

            Map<String, Object> body = new LinkedHashMap<>();
            body.put("database", "UP");
            body.put("latencyMs", latencyMs);
            body.put("version", shortVersion(version));
            if (databaseName != null) {
                body.put("databaseName", databaseName);
            }
            if (user != null) {
                body.put("user", user);
            }
            body.put("checkedAt", Instant.now().toString());
            return ResponseEntity.ok(body);

        } catch (DataAccessException e) {
            long latencyMs = (System.nanoTime() - start) / 1_000_000;
            Map<String, Object> body = new LinkedHashMap<>();
            body.put("database", "DOWN");
            body.put("latencyMs", latencyMs);
            body.put("error", safeMessage(e));
            body.put("checkedAt", Instant.now().toString());
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(body);
        }
    }

    private String queryOrNull(String sql) {
        try {
            return jdbcTemplate.queryForObject(sql, String.class);
        } catch (Exception e) {
            return null;
        }
    }

    /** "PostgreSQL 17.6 (Debian) on x86_64" -> "PostgreSQL 17.6" */
    private String shortVersion(String full) {
        if (full == null) {
            return null;
        }
        int cut = full.indexOf('(');
        String head = cut > 0 ? full.substring(0, cut).trim() : full.trim();
        int on = head.indexOf(" on ");
        return on > 0 ? head.substring(0, on).trim() : head;
    }

    /** Evita exponer credenciales que aparezcan en el mensaje de error. */
    private String safeMessage(Exception e) {
        Throwable cause = e.getMostSpecificCause();
        String msg = (cause != null && cause.getMessage() != null) ? cause.getMessage() : e.getMessage();
        if (msg == null) {
            msg = e.getClass().getSimpleName();
        }
        msg = msg.replaceAll("(?i)password=\\S+", "password=***");
        return msg.length() > 300 ? msg.substring(0, 300) + "..." : msg;
    }
}