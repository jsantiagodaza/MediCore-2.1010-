// frontend/src/data/alertas-mock.js
export const MOCK_ALERTAS = [
  {
    id: 'al-1',
    titulo: 'Alerta por lluvias intensas y posibles inundaciones',
    categoria: 'clima',
    ciudad: 'Bogotá',
    nivelRiesgo: 'alto',
    descripcion: 'Se esperan precipitaciones superiores a lo normal para la temporada. Riesgo de deslizamientos en zonas de ladera y acumulación de agua en vías principales.',
    recomendaciones: ['Evitar transitar por zonas de riesgo', 'Mantener limpias las alcantarillas', 'Tener a mano el kit de emergencia'],
    fuente: 'IDEAM',
    fechaActualizacion: 'Hace 2 horas',
    vigencia: 'Hasta el 15 de Noviembre',
    fechasAfectadas: [
      '2026-11-10', '2026-11-11', '2026-11-12', '2026-11-13', '2026-11-14', '2026-11-15'
    ]
  },
  {
    id: 'al-2',
    titulo: 'Pico de enfermedades respiratorias por cambios de temperatura',
    categoria: 'salud',
    ciudad: 'Medellín',
    nivelRiesgo: 'medio',
    descripcion: 'Las variaciones bruscas de temperatura han incrementado los casos de gripes y resfriados, especialmente en niños y adultos mayores.',
    recomendaciones: ['Abrigarse bien en las noches', 'Ventilar espacios cerrados', 'Reforzar el sistema inmune con Vitamina C'],
    fuente: 'Secretaría de Salud',
    fechaActualizacion: 'Hace 1 día',
    vigencia: 'Hasta el 30 de Noviembre',
    fechasAfectadas: [
      '2026-11-01', '2026-11-02', '2026-11-03', '2026-11-04', '2026-11-05', '2026-11-06', '2026-11-07', 
      '2026-11-08', '2026-11-09', '2026-11-10', '2026-11-11', '2026-11-12', '2026-11-13', '2026-11-14', 
      '2026-11-15', '2026-11-16', '2026-11-17', '2026-11-18', '2026-11-19', '2026-11-20', '2026-11-21', 
      '2026-11-22', '2026-11-23', '2026-11-24', '2026-11-25', '2026-11-26', '2026-11-27', '2026-11-28', 
      '2026-11-29', '2026-11-30'
    ]
  },
  {
    id: 'al-3',
    titulo: 'Alerta por calidad del aire regular',
    categoria: 'ambiental',
    ciudad: 'Bogotá',
    nivelRiesgo: 'medio',
    descripcion: 'Los niveles de material particulado han aumentado debido a incendios forestales en los alrededores de la sabana.',
    recomendaciones: ['Uso de tapabocas en exteriores', 'Evitar actividad física intensa al aire libre', 'Cerrar ventanas en horas de la tarde'],
    fuente: 'Secretaría de Ambiente',
    fechaActualizacion: 'Hace 5 horas',
    vigencia: 'Hasta nuevo aviso',
    // FECHAS AÑADIDAS: Del 8 al 12 de Noviembre
    fechasAfectadas: [
      '2026-11-08', '2026-11-09', '2026-11-10', '2026-11-11', '2026-11-12'
    ]
  },
  {
    id: 'al-4',
    titulo: 'Recomendación por ola de calor',
    categoria: 'clima',
    ciudad: 'Valledupar',
    nivelRiesgo: 'alto',
    descripcion: 'Temperaturas que superan los 38°C. Alto riesgo de golpe de calor y deshidratación.',
    recomendaciones: ['Aumentar la ingesta de agua', 'Evitar la exposición al sol entre 10am y 4pm', 'Usar protector solar'],
    fuente: 'IDEAM',
    fechaActualizacion: 'Hace 30 minutos',
    vigencia: 'Hasta el 12 de Noviembre',
    fechasAfectadas: [
      '2026-11-10', '2026-11-11', '2026-11-12'
    ]
  }
];

export const CIUDADES_DISPONIBLES = ['Todas', 'Bogotá', 'Medellín', 'Valledupar', 'Cali', 'Barranquilla'];
export const CATEGORIAS_DISPONIBLES = [
  { id: 'todas', label: 'Todas las categorías', icon: '🌍' },
  { id: 'clima', label: 'Clima', icon: '⛅' },
  { id: 'salud', label: 'Salud', icon: '🩺' },
  { id: 'ambiental', label: 'Ambiental', icon: '🌿' },
];