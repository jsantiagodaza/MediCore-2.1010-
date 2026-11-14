-- Issue #59: modelo de datos para alertas por temporada (sanitarias y ambientales)

-- Categorías de alerta
CREATE TABLE alert_categories (
    id     BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    code   VARCHAR(50)  NOT NULL UNIQUE,
    name   VARCHAR(100) NOT NULL,
    kind   VARCHAR(20)  NOT NULL,
    CONSTRAINT ck_alert_categories_kind CHECK (kind IN ('SANITARIA', 'AMBIENTAL')),
    CONSTRAINT ck_alert_categories_name_not_blank CHECK (btrim(name) <> '')
);

-- Niveles de riesgo (severity mayor = más grave)
CREATE TABLE risk_levels (
    id        BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    code      VARCHAR(30)  NOT NULL UNIQUE,
    name      VARCHAR(50)  NOT NULL,
    severity  SMALLINT     NOT NULL UNIQUE,
    CONSTRAINT ck_risk_levels_severity CHECK (severity BETWEEN 1 AND 10)
);

-- Ciudades, departamentos o regiones
CREATE TABLE regions (
    id           BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name         VARCHAR(120) NOT NULL,
    department   VARCHAR(120) NOT NULL,
    country      CHAR(2)      NOT NULL DEFAULT 'CO',
    region_type  VARCHAR(20)  NOT NULL DEFAULT 'CIUDAD',
    CONSTRAINT uq_regions_location UNIQUE (name, department, country),
    CONSTRAINT ck_regions_type CHECK (region_type IN ('CIUDAD', 'DEPARTAMENTO', 'REGION')),
    CONSTRAINT ck_regions_name_not_blank CHECK (btrim(name) <> '')
);

-- Fuentes de información (procedencia)
CREATE TABLE information_sources (
    id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name        VARCHAR(150) NOT NULL UNIQUE,
    url         VARCHAR(500),
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT ck_information_sources_name_not_blank CHECK (btrim(name) <> '')
);

-- Alertas
CREATE TABLE alerts (
    id                BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    title             VARCHAR(200) NOT NULL,
    description       TEXT         NOT NULL,
    category_id       BIGINT       NOT NULL REFERENCES alert_categories (id) ON DELETE RESTRICT,
    risk_level_id     BIGINT       NOT NULL REFERENCES risk_levels (id)      ON DELETE RESTRICT,
    source_id         BIGINT       NOT NULL REFERENCES information_sources (id) ON DELETE RESTRICT,
    source_reference  VARCHAR(500),                       -- enlace o referencia del boletín original
    status            VARCHAR(20)  NOT NULL DEFAULT 'ACTIVE',
    published_at      TIMESTAMPTZ  NOT NULL,              -- fecha de publicación en la fuente
    valid_from        TIMESTAMPTZ  NOT NULL,              -- inicio de vigencia
    valid_until       TIMESTAMPTZ,                        -- fin de vigencia (NULL = sin fecha de fin)
    created_at        TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at        TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT ck_alerts_status CHECK (status IN ('ACTIVE', 'CANCELLED')),
    CONSTRAINT ck_alerts_validity CHECK (valid_until IS NULL OR valid_until > valid_from),
    CONSTRAINT ck_alerts_title_not_blank CHECK (btrim(title) <> '')
);

CREATE TRIGGER trg_alerts_updated_at
    BEFORE UPDATE ON alerts
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Una alerta puede aplicar a varias regiones (muchos a muchos)
CREATE TABLE alert_regions (
    alert_id   BIGINT NOT NULL REFERENCES alerts (id)  ON DELETE CASCADE,
    region_id  BIGINT NOT NULL REFERENCES regions (id) ON DELETE RESTRICT,
    PRIMARY KEY (alert_id, region_id)
);

-- Índices para consultar por ubicación y categoría
CREATE INDEX idx_alert_regions_region ON alert_regions (region_id);
CREATE INDEX idx_alerts_category_validity ON alerts (category_id, valid_from, valid_until);
CREATE INDEX idx_alerts_risk_level ON alerts (risk_level_id);
CREATE INDEX idx_alerts_source ON alerts (source_id);
