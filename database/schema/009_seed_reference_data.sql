-- Issue #63: datos iniciales NECESARIOS en cualquier entorno (producción incluida).
-- Son catálogos de referencia, no datos de prueba. Idempotente.
INSERT INTO risk_levels (code, name, severity) VALUES
 ('BAJO',     'Bajo',     1),
 ('MODERADO', 'Moderado', 2),
 ('ALTO',     'Alto',     3),
 ('CRITICO',  'Crítico',  4)
ON CONFLICT (code) DO NOTHING;

INSERT INTO alert_categories (code, name, kind) VALUES
 ('ENF_VECTORES',     'Enfermedades transmitidas por vectores', 'SANITARIA'),
 ('ENF_RESPIRATORIAS','Enfermedades respiratorias',             'SANITARIA'),
 ('ENF_DIGESTIVAS',   'Enfermedades digestivas',                'SANITARIA'),
 ('CALOR_EXTREMO',    'Calor extremo',                          'AMBIENTAL'),
 ('CALIDAD_AIRE',     'Calidad del aire',                       'AMBIENTAL'),
 ('LLUVIAS',          'Lluvias e inundaciones',                 'AMBIENTAL')
ON CONFLICT (code) DO NOTHING;

INSERT INTO information_sources (name, url) VALUES
 ('Instituto Nacional de Salud (INS)',               'https://www.ins.gov.co'),
 ('IDEAM',                                           'https://www.ideam.gov.co'),
 ('Ministerio de Salud y Protección Social',         'https://www.minsalud.gov.co')
ON CONFLICT (name) DO NOTHING;

INSERT INTO regions (name, department, country, region_type) VALUES
 ('Cesar',        'Cesar',          'CO', 'DEPARTAMENTO'),
 ('Valledupar',   'Cesar',          'CO', 'CIUDAD'),
 ('Bogotá D.C.',  'Bogotá D.C.',    'CO', 'CIUDAD'),
 ('Medellín',     'Antioquia',      'CO', 'CIUDAD'),
 ('Cali',         'Valle del Cauca','CO', 'CIUDAD'),
 ('Barranquilla', 'Atlántico',      'CO', 'CIUDAD'),
 ('Cartagena',    'Bolívar',        'CO', 'CIUDAD'),
 ('Bucaramanga',  'Santander',      'CO', 'CIUDAD')
ON CONFLICT (name, department, country) DO NOTHING;
