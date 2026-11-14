-- Issues #59 y #60: consultas de alertas y notificaciones (usan el usuario demo; cambia el correo por el de tu usuario)

-- Alertas vigentes por ubicación (region_id = 2 -> Valledupar) y categoría (category_id = 6 -> Lluvias)
SELECT a.id, a.title, c.name AS categoria, rl.name AS riesgo, s.name AS fuente,
       a.valid_from, a.valid_until, a.updated_at
FROM alerts a
JOIN alert_regions ar     ON ar.alert_id = a.id
JOIN alert_categories c   ON c.id = a.category_id
JOIN risk_levels rl       ON rl.id = a.risk_level_id
JOIN information_sources s ON s.id = a.source_id
WHERE ar.region_id = 2
  AND a.category_id = 6
  AND a.status = 'ACTIVE'
  AND a.valid_from <= now()
  AND (a.valid_until IS NULL OR a.valid_until > now())
ORDER BY rl.severity DESC, a.valid_from DESC;

-- Preferencias de un usuario (usuario demo)
SELECT p.user_id, r.name AS region, p.notifications_enabled, p.frequency,
       COALESCE(array_agg(c.code) FILTER (WHERE c.code IS NOT NULL), '{}') AS categorias
FROM user_alert_preferences p
LEFT JOIN regions r ON r.id = p.region_id
LEFT JOIN user_preference_categories upc ON upc.user_id = p.user_id
LEFT JOIN alert_categories c ON c.id = upc.category_id
WHERE p.user_id = (SELECT id FROM users WHERE email = 'user@demo.medicore.test')
GROUP BY p.user_id, r.name, p.notifications_enabled, p.frequency;

-- Alertas vigentes que corresponden al usuario y que AÚN NO le han sido notificadas
SELECT a.id, a.title
FROM user_alert_preferences p
JOIN user_preference_categories upc ON upc.user_id = p.user_id
JOIN alert_regions ar ON ar.region_id = p.region_id
JOIN alerts a ON a.id = ar.alert_id AND a.category_id = upc.category_id
WHERE p.user_id = (SELECT id FROM users WHERE email = 'user@demo.medicore.test')
  AND p.notifications_enabled
  AND a.status = 'ACTIVE'
  AND a.valid_from <= now()
  AND (a.valid_until IS NULL OR a.valid_until > now())
  AND NOT EXISTS (SELECT 1 FROM alert_notifications n
                  WHERE n.user_id = p.user_id AND n.alert_id = a.id);

-- ¿Ya se notificó la alerta 1 al usuario demo?
SELECT EXISTS (SELECT 1 FROM alert_notifications WHERE user_id = (SELECT id FROM users WHERE email = 'user@demo.medicore.test') AND alert_id = 1) AS ya_notificada;

-- Registrar una notificación sin duplicar (si ya existe, no hace nada)
-- (Modifica datos: quita los -- para ejecutarla)
-- INSERT INTO alert_notifications (user_id, alert_id, status, sent_at)
-- VALUES ((SELECT id FROM users WHERE email = 'user@demo.medicore.test'), 1, 'SENT', now())
-- ON CONFLICT (user_id, alert_id) DO NOTHING;
