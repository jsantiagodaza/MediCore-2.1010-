-- Issue #27: consultas principales (parámetros $1 como en una sentencia preparada)

-- Medicamento por identificador
SELECT * FROM medicines WHERE id = $1;

-- Medicamentos por nombre (prefijo, sin distinguir mayúsculas) -> usa idx_medicines_name_lower
SELECT * FROM medicines
WHERE lower(name) LIKE lower($1) || '%' AND is_active
ORDER BY name;

-- Usuario por correo -> usa uq_users_email_lower
SELECT id, email, password_hash, role, status FROM users WHERE lower(email) = lower($1);

-- Verificar que la unicidad se respeta (ambas deben fallar con violación de unique):
-- INSERT INTO users (email, password_hash) VALUES ('ADMIN@demo.medicore.test', 'x');
-- INSERT INTO medicines (name, active_ingredient, strength, pharmaceutical_form)
--   VALUES ('Acetaminofén', 'Paracetamol', '500 mg', 'Tableta');

-- Revisar uso de índices (con pocos datos Postgres puede preferir seq scan;
-- para forzar la prueba: SET enable_seqscan = off;)
-- EXPLAIN ANALYZE SELECT * FROM medicines WHERE lower(name) LIKE 'ace%';
