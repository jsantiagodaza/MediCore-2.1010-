-- DATOS DE DEMOSTRACIÓN: no son información real de inventario
INSERT INTO medicines (name, active_ingredient, strength, pharmaceutical_form, description) VALUES
 ('Acetaminofén',  'Paracetamol',    '500 mg',        'Tableta',   'Analgésico y antipirético (demo)'),
 ('Ibuprofeno',    'Ibuprofeno',     '400 mg',        'Cápsula',   'Antiinflamatorio (demo)'),
 ('Amoxicilina',   'Amoxicilina',    '500 mg',        'Cápsula',   'Antibiótico (demo)'),
 ('Loratadina',    'Loratadina',     '10 mg',         'Tableta',   'Antihistamínico (demo)'),
 ('Omeprazol',     'Omeprazol',      '20 mg',         'Cápsula',   'Inhibidor de bomba de protones (demo)'),
 ('Salbutamol',    'Salbutamol',     '100 mcg/dosis', 'Inhalador', 'Broncodilatador (demo)')
ON CONFLICT (name, strength, pharmaceutical_form) DO NOTHING;
