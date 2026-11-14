-- Issue #61: revisión de integridad y estructuras duplicadas o inconsistentes.
-- Ejecuta cada bloque; en todos los casos lo esperado es 0 filas.

-- 1) Tablas sin clave primaria
SELECT c.relname AS tabla_sin_pk
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE c.relkind = 'r' AND n.nspname = 'public'
  AND NOT EXISTS (SELECT 1 FROM pg_constraint k WHERE k.conrelid = c.oid AND k.contype = 'p');

-- 2) Índices duplicados (misma tabla y misma definición de columnas)
SELECT indrelid::regclass AS tabla, array_agg(indexrelid::regclass) AS indices_duplicados
FROM pg_index
GROUP BY indrelid, indkey, indclass, indexprs::text, indpred::text
HAVING count(*) > 1;

-- 3) Claves foráneas sin índice que las respalde (afecta rendimiento al borrar/consultar)
SELECT c.conrelid::regclass AS tabla, c.conname AS fk
FROM pg_constraint c
WHERE c.contype = 'f'
  AND NOT EXISTS (
        SELECT 1 FROM pg_index i
        WHERE i.indrelid = c.conrelid
          AND (i.indkey::int2[])[0:cardinality(c.conkey) - 1] @> c.conkey
          AND c.conkey @> (i.indkey::int2[])[0:cardinality(c.conkey) - 1]);

-- 4) Correos repetidos sin distinguir mayúsculas
SELECT lower(email) AS correo, count(*) FROM users GROUP BY lower(email) HAVING count(*) > 1;

-- 5) Correos sin normalizar
SELECT id, email FROM users WHERE email <> lower(btrim(email));

-- 6) Registros del botiquín con datos inconsistentes (usuario inexistente, cantidad negativa)
SELECT k.id FROM user_medicine_kit k
LEFT JOIN users u ON u.id = k.user_id
WHERE u.id IS NULL OR k.quantity < 0;

-- 7) Notificaciones de usuarios que no tienen preferencias configuradas (revisar si es esperado)
SELECT n.id, n.user_id FROM alert_notifications n
LEFT JOIN user_alert_preferences p ON p.user_id = n.user_id
WHERE p.user_id IS NULL;
