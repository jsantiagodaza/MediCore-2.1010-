'use strict';
/**
 * Base de conocimiento de la interfaz MediCore.
 * Verificada contra index.html (rama Main, 18-11-2026).
 * Describir solo funciones visibles; no crear promesas de cuenta, inventario o alertas.
 */
const MODULES = Object.freeze({
  cuida: {
    title: 'Cuídate', route: 'cuida',
    aliases: ['cuidate', 'imc', 'indice de masa corporal', 'hidratacion', 'agua por dia', 'calculadora de agua'],
    about: 'Incluye una calculadora de índice de masa corporal (IMC) y otra de hidratación orientativa. El IMC utiliza edad, peso y altura; la calculadora de agua considera grupo de edad, referencia fisiológica, ciudad/clima, actividad y otras condiciones.',
    steps: 'Abre «Cuídate» en el menú superior. Elige «Índice de Masa Corporal (IMC)» o «Agua por Día», completa el formulario y pulsa el botón de cálculo.',
    limitations: 'Las cifras son orientativas; no constituyen diagnóstico ni sustituyen las indicaciones médicas, especialmente si existe restricción de líquidos.'
  },
  medicamentos: {
    title: 'Medicamentos', route: 'meds',
    aliases: ['medicamentos', 'catalogo', 'farmacos', 'buscar medicamento', 'fichas de medicamentos'],
    about: 'Permite consultar fichas de medicamentos con indicaciones generales, usos, posología de referencia y precauciones, y explorar el catálogo por nombre o categoría.',
    steps: 'Abre «Medicamentos», escribe un nombre en el buscador o usa los filtros de categoría y selecciona la ficha que te interese.',
    limitations: 'El catálogo es informativo. No permite comprar, solicitar recetas ni cambiar tratamientos; confirma la información con el prospecto y un profesional.'
  },
  sintomas: {
    title: 'Me siento mal (Síntomas)', route: 'mal',
    aliases: ['sintomas', 'me siento mal', 'evaluar sintomas', 'evaluacion de sintomas', 'evaluador de sintomas'],
    about: 'Ofrece orientación preventiva a partir de una selección de síntomas. La interfaz muestra los resultados de la evaluación y recomendaciones de orientación.',
    steps: 'Abre «Me siento mal», selecciona los síntomas que tienes y pulsa «Evaluar síntomas seleccionados». Lee el resultado y las advertencias.',
    limitations: 'No proporciona diagnósticos médicos. Si hay signos graves, busca atención de urgencias; en Colombia puedes llamar al 123.'
  },
  preparacion: {
    title: 'Prepárate (Preparación)', route: 'prep',
    aliases: ['preparate', 'preparacion', 'prevenir contingencias', 'alertas por temporada'],
    about: 'La página «Prepárate» presenta herramientas preventivas planificadas y ofrece un acceso a «Botiquín Esencial», que sí está disponible.',
    steps: 'Abre «Prepárate» en el menú superior. Desde allí puedes entrar a «Botiquín Esencial».',
    limitations: 'Las alertas por temporada (gripe, polen, olas de calor o frío) están marcadas «en desarrollo»; MediCore todavía no las emite.'
  },
  botiquin: {
    title: 'Botiquín Esencial', route: 'botiquin',
    aliases: ['botiquin', 'kit de primeros auxilios', 'checklist de botiquin', 'lista de faltantes', 'revision mensual'],
    about: 'Ofrece cinco tipos de kit según el contexto, listas interactivas de suministros y consejos de organización, conservación y revisión periódica.',
    steps: 'Abre «Botiquín», selecciona el tipo de kit, marca los elementos que ya tienes y consulta la barra de progreso. Puedes filtrar por pendientes, presentes o esenciales, buscar elementos, copiar faltantes, marcar todo o limpiar la selección. El avance se guarda en este dispositivo. En «Revisión mensual» puedes registrar la última revisión.',
    limitations: 'Es una lista de verificación, no un inventario clínico: no registra recetas, dosis ni existencias de medicamentos individuales, ni sincroniza automáticamente entre dispositivos.'
  }
});
function normalizeText(value) {
  return value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
}
const NAVIGATION = /(?:donde|como|cual|que|para que|explica|explicame|mostrar|muestrame|encontrar|ir a|entrar|abrir|acceder|usar|funciona|sirve|hacer|ayuda|herramientas|apartado|seccion|modulo|funciones|opciones|puedo|guia|navegar|conocer)/;
const PLATFORM = /(?:medicore|plataforma|aplicacion|app|modulos|apartados|secciones)/;
function findPlatformTopic(message) {
  const text = normalizeText(message);
  if (!text) return null;
  // La información sanitaria general no es una solicitud de navegación.
  // Mantener los contratos de HYDRATION, FIRST_AID_KIT y MED_NOT_FOUND.
  if (/\b(?:que (?:lleva|debe llevar|contiene|incluye) (?:un |el |mi )?botiquin|que (?:poner|guardar) en (?:un |el |mi )?botiquin)\b/.test(text)) return null;
  if (/\bpara que sirven? (?:estos|los|mis|esos) medicamentos\b/.test(text)) return null;
  // Evitar interferir con preguntas clínicas: «¿para qué sirve ibuprofeno?».
  // Para hidratación/botiquín, distinguir uso de interfaz de orientación sanitaria.
  const isNavigation = NAVIGATION.test(text) || PLATFORM.test(text);
  if (!isNavigation) return null;
  if (/(?:que modulos|cuales son los modulos|que apartados|que secciones|que puedo hacer en medicore|como funciona medicore|que es medicore)/.test(text)) return 'overview';
  for (const [id, mod] of Object.entries(MODULES)) {
    if (mod.aliases.some(alias => text.includes(alias))) return id;
  }
  return null;
}
function platformReply(message) {
  const id = findPlatformTopic(message);
  if (!id) return null;
  if (id === 'overview') return {
    category: 'navigation', safety: { level: 'ok', flags: [] },
    reply: 'En MediCore tienes «Cuídate» (IMC e hidratación), «Medicamentos» (catálogo), «Me siento mal» (orientación de síntomas), «Prepárate» (funciones en desarrollo y acceso al botiquín) y «Botiquín Esencial» (listas de verificación por situación). Selecciona cualquiera de estos apartados en el menú superior. También puedes preguntarme cómo usar uno de ellos.',
    sources: [], suggested_actions: ['Abrir el menú de MediCore']
  };
  const module = MODULES[id];
  return {
    category: 'navigation', safety: { level: 'ok', flags: [] },
    reply: `${module.title}: ${module.about}\n\nCómo usarlo: ${module.steps}\n\nImportante: ${module.limitations}`,
    sources: [], suggested_actions: [`Abrir ${module.title}`]
  };
}
module.exports = { MODULES, normalizeText, findPlatformTopic, platformReply };
