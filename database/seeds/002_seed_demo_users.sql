-- DATOS DE DEMOSTRACIÓN. Los hashes son marcadores: genera hashes BCrypt reales
-- (por ejemplo con BCryptPasswordEncoder de Spring Security) antes de usarlos para login.
INSERT INTO users (email, password_hash, full_name, role)
SELECT v.email, v.password_hash, v.full_name, v.role
FROM (VALUES
 ('admin@demo.medicore.test', '$2a$10$REEMPLAZAR_CON_HASH_BCRYPT_REAL_ADMIN', 'Admin Demo',   'ADMIN'),
 ('user@demo.medicore.test',  '$2a$10$REEMPLAZAR_CON_HASH_BCRYPT_REAL_USER',  'Usuario Demo', 'USER')
) AS v(email, password_hash, full_name, role)
WHERE NOT EXISTS (SELECT 1 FROM users u WHERE lower(u.email) = lower(v.email));
