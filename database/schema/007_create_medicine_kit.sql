-- Issue #62: botiquín personal. Cada registro pertenece a un único usuario.
CREATE TABLE user_medicine_kit (
    id               BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id          BIGINT        NOT NULL REFERENCES users (id)     ON DELETE CASCADE,
    medicine_id      BIGINT        NOT NULL REFERENCES medicines (id) ON DELETE RESTRICT,
    presentation     VARCHAR(100)  NOT NULL,               -- ej. 'Caja x 20 tabletas'
    quantity         NUMERIC(10,2) NOT NULL,
    unit             VARCHAR(30)   NOT NULL DEFAULT 'unidades',
    expiration_date  DATE          NOT NULL,               -- formato ISO yyyy-mm-dd
    notes            TEXT,
    created_at       TIMESTAMPTZ   NOT NULL DEFAULT now(),
    updated_at       TIMESTAMPTZ   NOT NULL DEFAULT now(),
    CONSTRAINT ck_user_medicine_kit_quantity CHECK (quantity >= 0),
    CONSTRAINT ck_user_medicine_kit_presentation_not_blank CHECK (btrim(presentation) <> '')
);

CREATE TRIGGER trg_user_medicine_kit_updated_at
    BEFORE UPDATE ON user_medicine_kit
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Recuperar el botiquín de un usuario y ordenar por vencimiento
CREATE INDEX idx_user_medicine_kit_user_expiration ON user_medicine_kit (user_id, expiration_date);
CREATE INDEX idx_user_medicine_kit_medicine ON user_medicine_kit (medicine_id);
