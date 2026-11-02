-- Tabla intermedia: relación muchos a muchos entre users y medicines
CREATE TABLE user_favorite_medicines (
    user_id      BIGINT      NOT NULL REFERENCES users (id)     ON DELETE CASCADE,
    medicine_id  BIGINT      NOT NULL REFERENCES medicines (id) ON DELETE CASCADE,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, medicine_id)
);

-- La PK cubre búsquedas por usuario; este índice cubre las búsquedas por medicamento
CREATE INDEX idx_user_favorite_medicines_medicine ON user_favorite_medicines (medicine_id);
