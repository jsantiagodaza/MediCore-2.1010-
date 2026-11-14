-- Issue #60: preferencias de alertas por usuario y control de notificaciones enviadas

-- Una fila de configuración por usuario
CREATE TABLE user_alert_preferences (
    user_id                BIGINT PRIMARY KEY REFERENCES users (id) ON DELETE CASCADE,
    region_id              BIGINT REFERENCES regions (id) ON DELETE SET NULL,
    notifications_enabled  BOOLEAN     NOT NULL DEFAULT TRUE,
    frequency              VARCHAR(20) NOT NULL DEFAULT 'IMMEDIATE',
    created_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT ck_user_alert_preferences_frequency CHECK (frequency IN ('IMMEDIATE', 'DAILY', 'WEEKLY'))
);

CREATE TRIGGER trg_user_alert_preferences_updated_at
    BEFORE UPDATE ON user_alert_preferences
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Categorías de interés del usuario (muchos a muchos)
CREATE TABLE user_preference_categories (
    user_id      BIGINT NOT NULL REFERENCES users (id)            ON DELETE CASCADE,
    category_id  BIGINT NOT NULL REFERENCES alert_categories (id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, category_id)
);

-- Registro de alertas notificadas: la restricción única evita enviar la misma alerta dos veces al mismo usuario
CREATE TABLE alert_notifications (
    id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id     BIGINT      NOT NULL REFERENCES users (id)  ON DELETE CASCADE,
    alert_id    BIGINT      NOT NULL REFERENCES alerts (id) ON DELETE CASCADE,
    status      VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    sent_at     TIMESTAMPTZ,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_alert_notifications_user_alert UNIQUE (user_id, alert_id),
    CONSTRAINT ck_alert_notifications_status CHECK (status IN ('PENDING', 'SENT', 'FAILED', 'READ')),
    CONSTRAINT ck_alert_notifications_sent CHECK (status <> 'SENT' OR sent_at IS NOT NULL)
);

CREATE INDEX idx_user_alert_preferences_region ON user_alert_preferences (region_id);
CREATE INDEX idx_user_preference_categories_category ON user_preference_categories (category_id);
CREATE INDEX idx_alert_notifications_alert ON alert_notifications (alert_id);
CREATE INDEX idx_alert_notifications_user_status ON alert_notifications (user_id, status);
