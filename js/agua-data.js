/* ==========================================================================
   MediCore — Datos y Referencias de Hidratación Personalizada (Agua por día)
   Basado en la Resolución 3803 de 2016 (RIEN - Minsalud Colombia), IDEAM y MedlinePlus
   ========================================================================== */

// Referencias poblacionales colombianas (Resolución 3803 de 2016 - Minsalud)
const RIEN_AGUA = {
  hombres_14_18: { total: 3.3, bebidas: 2.6, vasos: 10, label: 'Hombres, 14–18 años' },
  mujeres_14_18: { total: 2.3, bebidas: 1.8, vasos: 7, label: 'Mujeres, 14–18 años' },
  hombres_19_mas: { total: 3.7, bebidas: 3.0, vasos: 12, label: 'Hombres, 19 años o más' },
  mujeres_19_mas: { total: 2.7, bebidas: 2.2, vasos: 9, label: 'Mujeres, 19 años o más' },
  embarazo: { total: 3.0, bebidas: 2.3, vasos: 9, label: 'Embarazo (19–50 años)' },
  lactancia: { total: 3.8, bebidas: 3.1, vasos: 12, label: 'Lactancia (19–50 años)' }
};

// Normales climatológicas estándar oficiales (IDEAM Colombia - Periodo 1991–2020)
const CIUDADES_IDEAM = {
  valledupar: {
    nombre: 'Valledupar (Cesar)',
    tempPromedio: 28.4,
    tempMax: '33–36 °C',
    tipoClima: 'calido_extremo',
    climaLabel: 'Cálido intenso',
    contexto: 'Normal climatológica IDEAM: 28,4 °C de temperatura media habitual. Las máximas al mediodía superan los 34 °C.'
  },
  barranquilla: {
    nombre: 'Barranquilla (Atlántico)',
    tempPromedio: 28.1,
    tempMax: '32–34 °C',
    tipoClima: 'calido_humedo',
    climaLabel: 'Cálido húmedo costero',
    contexto: 'Normal climatológica IDEAM: 28,1 °C con alta humedad relativa que eleva la sensación térmica y la sudoración.'
  },
  cartagena: {
    nombre: 'Cartagena (Bolívar)',
    tempPromedio: 28.0,
    tempMax: '31–33 °C',
    tipoClima: 'calido_humedo',
    climaLabel: 'Cálido costero',
    contexto: 'Normal climatológica IDEAM: 28,0 °C con brisa marina constante pero alta radiación solar.'
  },
  santamarta: {
    nombre: 'Santa Marta (Magdalena)',
    tempPromedio: 28.3,
    tempMax: '32–35 °C',
    tipoClima: 'calido_extremo',
    climaLabel: 'Cálido seco/costero',
    contexto: 'Normal climatológica IDEAM: 28,3 °C promedio. Importante hidratación continua durante paseos y playa.'
  },
  cali: {
    nombre: 'Cali (Valle del Cauca)',
    tempPromedio: 24.0,
    tempMax: '29–31 °C',
    tipoClima: 'calido_moderado',
    climaLabel: 'Cálido moderado',
    contexto: 'Normal climatológica IDEAM: 24,0 °C promedio, con tardes calurosas y brisa al final del día.'
  },
  medellin: {
    nombre: 'Medellín (Antioquia)',
    tempPromedio: 22.5,
    tempMax: '27–28 °C',
    tipoClima: 'templado',
    climaLabel: 'Templado de montaña',
    contexto: 'Normal climatológica IDEAM: 22,5 °C promedio. Clima templado agradable con variaciones de lluvia y sol.'
  },
  bucaramanga: {
    nombre: 'Bucaramanga (Santander)',
    tempPromedio: 23.0,
    tempMax: '27–29 °C',
    tipoClima: 'templado',
    climaLabel: 'Templado meseta',
    contexto: 'Normal climatológica IDEAM: 23,0 °C promedio. Buen equilibrio térmico durante la mayor parte del año.'
  },
  pereira: {
    nombre: 'Pereira / Eje Cafetero',
    tempPromedio: 21.5,
    tempMax: '26–27 °C',
    tipoClima: 'templado',
    climaLabel: 'Templado cafetero',
    contexto: 'Normal climatológica IDEAM: 21,5 °C promedio. Clima templado con humedad moderada.'
  },
  bogota: {
    nombre: 'Bogotá D.C.',
    tempPromedio: 13.5,
    tempMax: '18–20 °C',
    tipoClima: 'frio',
    climaLabel: 'Frío de sabana andina',
    contexto: 'Normal climatológica IDEAM: 13,5 °C promedio. En climas fríos se suele percibir menos sed, pero el cuerpo sigue necesitando líquidos.'
  },
  tunja_pasto: {
    nombre: 'Tunja / Pasto (Altiplano)',
    tempPromedio: 12.8,
    tempMax: '17–19 °C',
    tipoClima: 'frio',
    climaLabel: 'Frío de altura',
    contexto: 'Normal climatológica IDEAM: 12,8 °C promedio. La baja temperatura reduce el estímulo de sed; bebe de manera programada.'
  },
  otra_calida: {
    nombre: 'Otra ciudad — Clima cálido (>27 °C)',
    tempPromedio: 28.0,
    tempMax: '>32 °C',
    tipoClima: 'calido_extremo',
    climaLabel: 'Cálido',
    contexto: 'Entornos con temperaturas superiores a 27 °C requieren especial atención a la reposición de líquidos por sudoración.'
  },
  otra_templada: {
    nombre: 'Otra ciudad — Clima templado (18–26 °C)',
    tempPromedio: 22.0,
    tempMax: '25–27 °C',
    tipoClima: 'templado',
    climaLabel: 'Templado',
    contexto: 'Condiciones moderadas. Mantén tu consumo habitual de referencia y bebe ante los primeros avisos de sed.'
  },
  otra_fria: {
    nombre: 'Otra ciudad — Clima frío (<18 °C)',
    tempPromedio: 14.0,
    tempMax: '18–19 °C',
    tipoClima: 'frio',
    climaLabel: 'Frío',
    contexto: 'El aire frío y seco también genera pérdidas respiratorias. No esperes a tener sed intensa para hidratarte.'
  }
};

// 6 Funciones esenciales del agua en el organismo (MedlinePlus)
const FUNCIONES_AGUA = [
  {
    num: 1,
    titulo: 'Mantiene el funcionamiento celular',
    desc: 'Todas las células y órganos necesitan agua para realizar sus procesos biológicos. El cuerpo pierde líquidos al respirar, orinar y sudar, por lo que debe reponerlos a diario.',
    img: 'assets/sistema-del-cuerpo-agua.png',
    badge: 'Fisiología vital'
  },
  {
    num: 2,
    titulo: 'Regula la temperatura corporal',
    desc: 'La sudoración es el mecanismo principal para disipar el calor interno. En ambientes calurosos o durante el ejercicio, las pérdidas aumentan y deben reponerse para evitar golpes de calor.',
    img: 'assets/mol-calorcito.png',
    badge: 'Termorregulación'
  },
  {
    num: 3,
    titulo: 'Participa en la eliminación de desechos',
    desc: 'Los riñones filtran la sangre y usan el agua para formar la orina y expulsar residuos metabólicos y toxinas. Una hidratación adecuada previene la formación de cálculos renales.',
    img: 'assets/organos-agua.png',
    badge: 'Salud renal'
  },
  {
    num: 4,
    titulo: 'Favorece la digestión y el tránsito',
    desc: 'El agua ayuda a disolver los nutrientes para que el intestino los absorba y ablanda las heces, previniendo el estreñimiento junto con una alimentación rica en fibra.',
    img: 'assets/organos-agua.png',
    badge: 'Digestión'
  },
  {
    num: 5,
    titulo: 'Lubrica tejidos, articulaciones y ojos',
    desc: 'Forma parte integral de la saliva, el líquido sinovial que protege las articulaciones del desgaste y las lágrimas que mantienen húmeda la superficie ocular.',
    img: 'assets/sistema-del-cuerpo-agua.png',
    badge: 'Protección de tejidos'
  },
  {
    num: 6,
    titulo: 'Mantiene el rendimiento físico y mental',
    desc: 'Una deshidratación leve de apenas el 1–2% reduce la resistencia muscular, la concentración, la memoria de trabajo y la agilidad mental, provocando fatiga prematura.',
    img: 'assets/rendimiento-fisico-agua.png',
    badge: 'Energía y enfoque'
  }
];

// Señales y escala de hidratación por color de orina
const ESCALA_ORINA = [
  { color: '#f7fee7', border: '#d9f99d', label: 'Excelente hidratación', desc: 'Transparente o amarillo muy claro. Estás en un nivel óptimo.' },
  { color: '#fef08a', border: '#facc15', label: 'Hidratación adecuada', desc: 'Amarillo pálido / paja. Nivel normal y saludable.' },
  { color: '#fde047', border: '#eab308', label: 'Bebe un vaso de agua', desc: 'Amarillo vivo o medio. Tu cuerpo comienza a requerir líquidos.' },
  { color: '#fb923c', border: '#ea580c', label: 'Deshidratación leve a moderada', desc: 'Ámbar o amarillo oscuro. Hidrátate con prontitud.' },
  { color: '#b45309', border: '#78350f', label: 'Deshidratación pronunciada', desc: 'Ámbar muy oscuro o marrón. Bebe agua de inmediato; si persiste, consulta al médico.' }
];

// Fuentes oficiales de referencia
const FUENTES_AGUA = [
  {
    titulo: 'Ministerio de Salud y Protección Social de Colombia (Resolución 3803 de 2016)',
    desc: 'Recomendaciones de Ingesta de Energía y Nutrientes (RIEN) para la población colombiana.',
    url: 'https://www.minsalud.gov.co/'
  },
  {
    titulo: 'MedlinePlus — Agua en la dieta y Deshidratación',
    desc: 'Biblioteca Nacional de Medicina de los Estados Unidos: funciones, requerimientos y signos de alerta.',
    url: 'https://medlineplus.gov/spanish/ency/article/002471.htm'
  },
  {
    titulo: 'IDEAM — Normales climatológicas estándar 1991–2020',
    desc: 'Instituto de Hidrología, Meteorología y Estudios Ambientales: promedios históricos de temperatura de ciudades de Colombia.',
    url: 'http://www.ideam.gov.co/'
  },
  {
    titulo: 'ICBF — La importancia de una adecuada hidratación',
    desc: 'Instituto Colombiano de Bienestar Familiar: guías nutricionales de hidratación saludable.',
    url: 'https://www.icbf.gov.co/'
  }
];

