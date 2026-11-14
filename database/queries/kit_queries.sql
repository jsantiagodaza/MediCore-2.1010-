-- Issue #62: operaciones del botiquín personal (usan el usuario demo; cambia el correo por el de tu usuario)
-- Todas filtran por user_id para no mezclar registros de distintos usuarios.

-- Botiquín completo de un usuario
SELECT k.id, m.name, m.active_ingredient, m.strength, k.presentation, k.quantity, k.unit, k.expiration_date
FROM user_medicine_kit k
JOIN medicines m ON m.id = k.medicine_id
WHERE k.user_id = (SELECT id FROM users WHERE email = 'user@demo.medicore.test')
ORDER BY k.expiration_date;

-- Próximos a vencer en 30 días (excluye los ya vencidos)
SELECT k.id, m.name, k.presentation, k.expiration_date, (k.expiration_date - current_date) AS dias_restantes
FROM user_medicine_kit k
JOIN medicines m ON m.id = k.medicine_id
WHERE k.user_id = (SELECT id FROM users WHERE email = 'user@demo.medicore.test')
  AND k.expiration_date BETWEEN current_date AND current_date + 30
ORDER BY k.expiration_date;

-- Ya vencidos
SELECT k.id, m.name, k.presentation, k.expiration_date
FROM user_medicine_kit k
JOIN medicines m ON m.id = k.medicine_id
WHERE k.user_id = (SELECT id FROM users WHERE email = 'user@demo.medicore.test') AND k.expiration_date < current_date;

-- (Sentencias que MODIFICAN datos: quita los -- para ejecutarlas)

-- Actualizar cantidad (solo si el registro pertenece al usuario; 0 filas afectadas = no es suyo)
-- UPDATE user_medicine_kit SET quantity = 8 WHERE id = 1 AND user_id = (SELECT id FROM users WHERE email = 'user@demo.medicore.test');

-- Eliminar un registro (misma regla de propietario)
-- DELETE FROM user_medicine_kit WHERE id = 1 AND user_id = (SELECT id FROM users WHERE email = 'user@demo.medicore.test');
