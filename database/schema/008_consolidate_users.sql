-- Issue #61: consolidación de la persistencia de usuarios
-- 1) Normaliza correos existentes (si dos correos difieren solo en mayúsculas/espacios,
--    el índice único fallará y la migración se revierte: corrige esos duplicados a mano).
UPDATE users SET email = lower(btrim(email)) WHERE email <> lower(btrim(email));

-- 2) Desde ahora los correos se guardan siempre normalizados.
ALTER TABLE users
    ADD CONSTRAINT ck_users_email_normalized CHECK (email = lower(btrim(email)));

-- 3) Integridad de datos personales:
--    las tablas personales (user_medicine_kit, user_alert_preferences, user_preference_categories,
--    alert_notifications, user_favorite_medicines) referencian users(id) con ON DELETE CASCADE,
--    de modo que los datos personales nunca quedan huérfanos ni asociados a otro propietario.
