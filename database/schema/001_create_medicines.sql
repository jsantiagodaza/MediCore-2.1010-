-- Issue #4 / #24: tabla de medicamentos
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS trigger AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE medicines (
    id                   BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name                 VARCHAR(150) NOT NULL,
    active_ingredient    VARCHAR(150) NOT NULL,
    strength             VARCHAR(50)  NOT NULL,   -- concentración, ej. '500 mg'
    pharmaceutical_form  VARCHAR(50)  NOT NULL,   -- ej. 'Tableta'
    description          TEXT,
    is_active            BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at           TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at           TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT uq_medicines_presentation UNIQUE (name, strength, pharmaceutical_form),
    CONSTRAINT ck_medicines_name_not_blank CHECK (btrim(name) <> ''),
    CONSTRAINT ck_medicines_ingredient_not_blank CHECK (btrim(active_ingredient) <> ''),
    CONSTRAINT ck_medicines_strength_not_blank CHECK (btrim(strength) <> ''),
    CONSTRAINT ck_medicines_form_not_blank CHECK (btrim(pharmaceutical_form) <> '')
);

CREATE TRIGGER trg_medicines_updated_at
    BEFORE UPDATE ON medicines
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
