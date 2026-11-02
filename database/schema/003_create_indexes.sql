-- Issue #27: índices para las búsquedas principales
-- Búsqueda por nombre (exacta o por prefijo, sin distinguir mayúsculas)
CREATE INDEX idx_medicines_name_lower ON medicines (lower(name) text_pattern_ops);

-- Búsqueda por principio activo
CREATE INDEX idx_medicines_active_ingredient_lower ON medicines (lower(active_ingredient) text_pattern_ops);

-- Medicamentos activos del catálogo
CREATE INDEX idx_medicines_active ON medicines (is_active) WHERE is_active;

-- Usuarios: la búsqueda por correo ya usa uq_users_email_lower;
-- el id ya está cubierto por la clave primaria de cada tabla.
CREATE INDEX idx_users_status ON users (status);
