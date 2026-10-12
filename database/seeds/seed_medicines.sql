-- =====================================================================
-- MediCore - Datos iniciales de medicamentos
-- Archivo : database/seeds/001_seed_medicines.sql
-- Requiere: haber ejecutado database/schema/001_create_medicines.sql
-- Idempotente: ON CONFLICT evita duplicados al re-ejecutar.
-- =====================================================================

INSERT INTO medicines (name, active_ingredient, strength, pharmaceutical_form) VALUES
    ('Acetaminofén',  'Acetaminofén',       '500 mg',      'Tableta'),
    ('Ibuprofeno',    'Ibuprofeno',         '400 mg',      'Tableta'),
    ('Amoxicilina',   'Amoxicilina',        '500 mg',      'Cápsula'),
    ('Amoxicilina',   'Amoxicilina',        '250 mg/5 mL', 'Suspensión oral'),
    ('Loratadina',    'Loratadina',         '10 mg',       'Tableta'),
    ('Omeprazol',     'Omeprazol',          '20 mg',       'Cápsula'),
    ('Metformina',    'Metformina',         '850 mg',      'Tableta'),
    ('Losartán',      'Losartán potásico',  '50 mg',       'Tableta'),
    ('Atorvastatina', 'Atorvastatina',      '20 mg',       'Tableta'),
    ('Diclofenaco',   'Diclofenaco sódico', '50 mg',       'Tableta'),
    ('Salbutamol',    'Salbutamol',         '100 mcg',     'Inhalador'),
    ('Dolex',         'Acetaminofén',       '500 mg',      'Tableta')
ON CONFLICT ON CONSTRAINT uq_medicines_name_strength_form DO NOTHING;
