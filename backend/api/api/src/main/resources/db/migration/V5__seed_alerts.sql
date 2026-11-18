-- ============================================================
--  V5: alertas de temporada de ejemplo (registros persistidos)
-- ============================================================

insert into season_alert
    (title, description, category, risk_level, city, region, source, starts_on, ends_on, active, created_at)
values
    ('Dengue en aumento en Valledupar',
     'Los casos de dengue confirmados se incrementaron en las ultimas cuatro semanas. Elimina criaderos de agua estancada y usa repelente.',
     'Enfermedad transmitida por vectores', 'ALTO', 'Valledupar', 'Cesar',
     'Secretaria de Salud del Cesar', '2026-11-01', '2026-12-31', true, '2026-11-01 08:00:00'),

    ('Brote de dengue en Aguachica',
     'Se confirma circulacion de dengue serotipo 2 en varios barrios. Consulta al servicio de salud ante fiebre alta, dolor muscular o sarpullido.',
     'Enfermedad transmitida por vectores', 'ALTO', 'Aguachica', 'Cesar',
     'Secretaria de Salud del Cesar', '2026-11-03', '2026-12-31', true, '2026-11-03 09:30:00'),

    ('Influenza estacional en el Cesar',
     'Aumento de infecciones respiratorias agudas por influenza. Vacunate si tienes mas de 60 anos, eres gestante o tienes enfermedad cronica.',
     'Enfermedad respiratoria', 'MEDIO', null, 'Cesar',
     'Instituto Nacional de Salud', '2026-10-15', '2027-02-28', true, '2026-10-15 07:00:00'),

    ('Influenza: casos en Codazzi',
     'Se reportan casos de influenza en colegios del municipio. Ventila los espacios y laven las manos con frecuencia.',
     'Enfermedad respiratoria', 'MEDIO', 'Codazzi', 'Cesar',
     'Instituto Nacional de Salud', '2026-11-06', '2027-01-31', true, '2026-11-06 10:15:00'),

    ('Calor extremo en el valle del Cesar',
     'Temperaturas cercanas a 40 grados con sensacion termica mayor. Hidratate durante todo el dia y evita la exposicion al sol entre 10 a. m. y 4 p. m.',
     'Clima extremo', 'ALTO', 'Valledupar', 'Cesar',
     'IDEAM', '2026-11-05', '2026-12-15', true, '2026-11-05 06:45:00'),

    ('Lluvias intensas y riesgo de inundacion',
     'Se esperan lluvias por encima de lo normal. Identifica las rutas de evacuacion de tu barrio y no cruces corrientes de agua.',
     'Clima extremo', 'MEDIO', 'Bosconia', 'Cesar',
     'IDEAM', '2026-11-01', '2026-12-31', true, '2026-11-01 06:00:00'),

    ('Agua no potable en La Jagua de Ibirico',
     'El acueducto reporta presencia de coliformes. Hierve el agua antes de consumirla y no laves alimentos con agua de la llave.',
     'Calidad del agua', 'CRITICO', 'La Jagua de Ibirico', 'Cesar',
     'Secretaria de Salud del Cesar', '2026-11-08', '2026-11-30', true, '2026-11-08 12:00:00'),

    ('Enfermedad diarreica aguda en menores',
     'Aumento de consultas por diarrea en menores de cinco anos. Usa suero oral ante la primera deposicion liquida y consulta si hay deshidratacion.',
     'Enfermedad diarreica', 'ALTO', 'Chiriguana', 'Cesar',
     'Secretaria de Salud del Cesar', '2026-11-02', '2026-12-20', true, '2026-11-02 11:20:00'),

    ('Alerta nacional por chikunguna',
     'Circulacion de chikunguna en varios departamentos. Las medidas contra el mosquito son las mismas del dengue.',
     'Enfermedad transmitida por vectores', 'MEDIO', null, 'Nacional',
     'Instituto Nacional de Salud', '2026-11-01', '2026-12-31', true, '2026-11-01 09:00:00'),

    ('Intoxicacion alimentaria en ferias',
     'Se reportan casos asociados a alimentos vendidos sin cadena de frio. Revisa el estado de los productos antes de comprarlos.',
     'Inocuidad alimentaria', 'MEDIO', 'San Alberto', 'Cesar',
     'Instituto Nacional de Vigilancia de Medicamentos y Alimentos', '2026-11-04', '2026-12-10', true, '2026-11-04 13:00:00'),

    ('Calidad del aire por quemas',
     'Quemas de pastizales elevan el material particulado. Personas con asma deben limitar la actividad fisica al aire libre.',
     'Calidad del aire', 'BAJO', null, 'Cesar',
     'IDEAM', '2026-11-07', '2026-12-31', true, '2026-11-07 05:30:00'),

    ('Radiacion ultravioleta muy alta',
     'Indice UV en nivel extremo al mediodia. Usa protector solar y sombrero, sobre todo ninos y personas de piel clara.',
     'Clima extremo', 'BAJO', 'Pailitas', 'Cesar',
     'IDEAM', '2026-11-09', '2026-12-31', true, '2026-11-09 06:10:00'),

    ('Jornada de vacunacion antirrabica',
     'Jornada de vacunacion de mascotas en el municipio. Si te muerde un animal acude de inmediato al centro de salud.',
     'Zoonosis', 'BAJO', 'Pailitas', 'Cesar',
     'Secretaria de Salud del Cesar', '2026-11-10', '2026-11-25', true, '2026-11-10 08:00:00'),

    ('Dengue: alerta historica del primer semestre',
     'Alerta cerrada por brote de dengue durante el primer semestre del ano. Se conserva para trazabilidad y consultas historicas.',
     'Enfermedad transmitida por vectores', 'ALTO', 'Pailitas', 'Cesar',
     'Secretaria de Salud del Cesar', '2026-04-01', '2026-06-30', false, '2026-04-01 08:00:00');