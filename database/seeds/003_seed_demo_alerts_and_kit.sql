-- DATOS DE DEMOSTRACIÓN (alertas ficticias, botiquín de prueba). No usar en producción.
-- Requiere: migraciones 001-009 y seeds 001 y 002.
INSERT INTO alerts (title, description, category_id, risk_level_id, source_id, source_reference, published_at, valid_from, valid_until)
SELECT 'Alerta DEMO: temporada de lluvias', 'Alerta ficticia para pruebas.',
       (SELECT id FROM alert_categories WHERE code = 'LLUVIAS'),
       (SELECT id FROM risk_levels WHERE code = 'MODERADO'),
       (SELECT id FROM information_sources WHERE name = 'IDEAM'),
       'demo://alerta-lluvias-1', now(), now() - interval '1 day', now() + interval '30 days'
WHERE NOT EXISTS (SELECT 1 FROM alerts WHERE source_reference = 'demo://alerta-lluvias-1');

INSERT INTO alert_regions (alert_id, region_id)
SELECT a.id, r.id FROM alerts a, regions r
WHERE a.source_reference = 'demo://alerta-lluvias-1' AND r.name = 'Valledupar'
ON CONFLICT DO NOTHING;

INSERT INTO user_alert_preferences (user_id, region_id, frequency)
SELECT u.id, (SELECT id FROM regions WHERE name = 'Valledupar'), 'DAILY'
FROM users u WHERE lower(u.email) = 'user@demo.medicore.test'
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO user_preference_categories (user_id, category_id)
SELECT u.id, c.id FROM users u, alert_categories c
WHERE lower(u.email) = 'user@demo.medicore.test' AND c.code IN ('LLUVIAS', 'CALOR_EXTREMO')
ON CONFLICT DO NOTHING;

INSERT INTO user_medicine_kit (user_id, medicine_id, presentation, quantity, unit, expiration_date)
SELECT u.id, m.id, v.presentation, v.quantity, 'unidades', v.expiration_date
FROM users u
JOIN (VALUES
   ('Acetaminofén', 'Caja x 20 tabletas', 12, (current_date + 20)),
   ('Ibuprofeno',   'Caja x 10 cápsulas',  6, (current_date + 200)),
   ('Loratadina',   'Caja x 10 tabletas',  3, (current_date - 5))
) AS v(name, presentation, quantity, expiration_date) ON TRUE
JOIN medicines m ON m.name = v.name
WHERE lower(u.email) = 'user@demo.medicore.test'
  AND NOT EXISTS (SELECT 1 FROM user_medicine_kit k
                  WHERE k.user_id = u.id AND k.medicine_id = m.id AND k.presentation = v.presentation);
