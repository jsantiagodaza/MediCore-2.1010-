-- =====================================================================
-- MediCore - Esquema de medicamentos
-- Archivo : database/schema/001_create_medicines.sql
-- Motor   : PostgreSQL 13+
-- Idempotente: se puede ejecutar varias veces sin error.
-- =====================================================================

CREATE TABLE IF NOT EXISTS medicines (
    id                  BIGINT GENERATED ALWAYS AS IDENTITY,
    name                VARCHAR(150) NOT NULL,
    active_ingredient   VARCHAR(150) NOT NULL,
    strength            VARCHAR(50)  NOT NULL,
    pharmaceutical_form VARCHAR(50)  NOT NULL,

    CONSTRAINT pk_medicines PRIMARY KEY (id),

    -- Evita duplicados: mismo nombre + concentracion + forma farmaceutica
    CONSTRAINT uq_medicines_name_strength_form
        UNIQUE (name, strength, pharmaceutical_form),

    -- Evita textos vacios o solo espacios
    CONSTRAINT ck_medicines_name_not_blank
        CHECK (btrim(name) <> ''),
    CONSTRAINT ck_medicines_active_ingredient_not_blank
        CHECK (btrim(active_ingredient) <> ''),
    CONSTRAINT ck_medicines_strength_not_blank
        CHECK (btrim(strength) <> ''),
    CONSTRAINT ck_medicines_pharmaceutical_form_not_blank
        CHECK (btrim(pharmaceutical_form) <> '')
);

-- Indices para las busquedas mas comunes del backend
-- (busqueda por nombre sin distinguir mayusculas y por principio activo)
CREATE INDEX IF NOT EXISTS idx_medicines_name_lower
    ON medicines (lower(name));

CREATE INDEX IF NOT EXISTS idx_medicines_active_ingredient_lower
    ON medicines (lower(active_ingredient));

COMMENT ON TABLE  medicines                     IS 'Catalogo de medicamentos de MediCore';
COMMENT ON COLUMN medicines.id                  IS 'Identificador autogenerado';
COMMENT ON COLUMN medicines.name                IS 'Nombre del medicamento (generico o comercial)';
COMMENT ON COLUMN medicines.active_ingredient   IS 'Principio activo';
COMMENT ON COLUMN medicines.strength            IS 'Concentracion o dosis, p. ej. 500 mg';
COMMENT ON COLUMN medicines.pharmaceutical_form IS 'Forma farmaceutica, p. ej. Tableta, Capsula, Jarabe';
