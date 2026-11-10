'use strict';
const { classifySafety, normalize } = require('./safety');
const { loadCatalog, findMedication, findSymptoms, isPrescriptionOnly, SOURCES } = require('./knowledge');
const { isActive, scopeFromEnv, SCOPE } = require('./intents');
const { interactionAnswer, needsProfessionalOnly } = require('./interactions');

const catalog = loadCatalog();

const DISCLAIMER =
  'Prototipo informativo de MediCore. No es un médico, no diagnostica ni receta. Ante dudas o síntomas, consulta a un profesional de la salud.';

const S = (...keys) => keys.map((k) => SOURCES[k]);

function build(category, level, reply, extra = {}) {
  return {
    category,
    safety: { level, flags: extra.flags || [] },
    reply,
    sources: extra.sources || [],
    suggested_actions: extra.actions || []
  };
}

function emergency() {
  return build(
    'emergency',
    'emergency',
    'Lo que describes puede ser una emergencia. Por favor llama ya a la línea de emergencias 123 (Colombia) o acude de inmediato al servicio de urgencias más cercano. Si hay alguien contigo, pídele que te acompañe. No esperes a que pase ni intentes tratarlo por tu cuenta con medicamentos.',
    { flags: ['emergency'], actions: ['Llamar al 123', 'Ir a urgencias'] }
  );
}

function selfHarm() {
  return build(
    'self_harm',
    'emergency',
    'Siento mucho que estés pasando por algo tan doloroso, y me importa que estés a salvo. Lo que sientes merece atención de una persona real ahora mismo: si estás en peligro inmediato, llama al 123. Si puedes, busca a alguien de confianza que esté cerca para que te acompañe. También puedes acudir a urgencias, donde te pueden ayudar de inmediato.',
    { flags: ['self_harm'], actions: ['Llamar al 123', 'Contactar a una persona de confianza'] }
  );
}

function injection() {
  return build(
    'prompt_injection',
    'blocked',
    'No puedo cambiar mis reglas de seguridad ni compartir información interna. Sí puedo darte información general sobre medicamentos del catálogo, hidratación o botiquín. ¿Sobre qué te gustaría saber?',
    { flags: ['prompt_injection'] }
  );
}

function medSummary(m) {
  // Se omiten precauciones con cifras (límites de dosis/duración): el asistente no da pautas de dosificación
  const prec = m.prec.filter((p) => !/\d/.test(p));
  const hadLimits = prec.length !== m.prec.length;
  const lines = [
    `${m.n} (${m.cat}): ${m.uso}`,
    `Se usa habitualmente en: ${m.cuando}`,
    `Precauciones y contraindicaciones: ${prec.join('; ')}.`
  ];
  if (hadLimits) lines.push('Los límites de dosis y duración los define tu médico o farmacéutico y están en el prospecto.');
  if (isPrescriptionOnly(m)) lines.push('Importante: este medicamento requiere prescripción médica.');
  return lines.join('\n');
}

function diagnosis(message) {
  const syms = findSymptoms(message, catalog.symptoms).map((s) => s.n.toLowerCase());
  const mention = syms.length ? ` Mencionas: ${syms.join(', ')}.` : '';
  return build(
    'diagnosis_refused',
    'refused',
    `No puedo diagnosticar ni decirte qué enfermedad tienes: eso solo puede hacerlo un profesional de la salud que te evalúe.${mention} Lo que sí puedo decirte es cuándo no esperar: si tienes dificultad para respirar, dolor de pecho, fiebre muy alta o que no cede, confusión, deshidratación o un síntoma que empeora rápido, busca atención médica pronto. Para orientación, puedes consultar con tu EPS o un médico.`,
    { flags: ['diagnosis_request'], sources: S('minsalud'), actions: ['Consultar a un profesional de la salud'] }
  );
}

function prescription(message) {
  const med = findMedication(message, catalog.meds);
  const base =
    'No puedo indicar dosis, horarios ni recomendar qué tratamiento tomar para tu caso: depende de tu edad, peso, otras enfermedades, embarazo y otros medicamentos. Esa decisión debe tomarla un médico o un farmacéutico, y en el empaque o prospecto del producto encuentras la información oficial.';
  if (med) {
    return build('prescription_refused', 'refused', `${base}\n\nInformación general (sin dosis):\n${medSummary(med)}`, {
      flags: ['dosage_or_prescription_request'],
      sources: S('catalog', 'medline', 'invima'),
      actions: ['Consultar a un farmacéutico o médico', 'Leer el prospecto']
    });
  }
  return build('prescription_refused', 'refused', base, {
    flags: ['dosage_or_prescription_request'],
    sources: S('medline', 'invima'),
    actions: ['Consultar a un farmacéutico o médico']
  });
}

function medicationInfo(m) {
  return build('medication_info', 'ok', medSummary(m), {
    sources: S('catalog', 'medline'),
    actions: ['Consultar a un farmacéutico o médico antes de usarlo']
  });
}

function comingSoon(intentId, topic, section) {
  return build(
    'coming_soon',
    'ok',
    `Por ahora solo puedo ayudarte con información de los medicamentos del catálogo de MediCore. ${topic} estará disponible en una próxima versión. Mientras tanto, puedes visitar la sección “${section}” de la app.`,
    { flags: [`planned_intent:${intentId}`], actions: [`Abrir la sección ${section}`] }
  );
}

function generalTopics(message, scope) {
  const t = normalize(message);
  if (/^(hola|buenas|buenos dias|buenas tardes|buenas noches|hey)\b/.test(t))
    return build('greeting', 'ok', 'Hola, soy Mol Paramédico, el asistente informativo de MediCore (prototipo). Puedo darte información general sobre los medicamentos del catálogo (para qué sirven, cuándo se usan y sus precauciones) y orientarte sobre posibles interacciones entre dos medicamentos. No diagnostico ni receto.');
  if (/agua|hidrat/.test(t)) {
    if (!isActive('HYDRATION', scope)) return comingSoon('HYDRATION', 'La orientación sobre hidratación', 'Cuídate → Agua');
    return build('hydration', 'ok', 'Mantenerte hidratado ayuda a tu cuerpo a funcionar bien. La necesidad de agua cambia con la edad, el clima, la actividad física y algunas condiciones de salud. En la sección “Cuídate → Agua” de MediCore puedes calcular una meta orientativa. Si tienes una condición médica con restricción de líquidos, sigue la indicación de tu médico.', { sources: S('oms'), actions: ['Abrir la calculadora de hidratación'] });
  }
  if (/botiquin|primeros auxilios/.test(t)) {
    if (!isActive('FIRST_AID_KIT', scope)) return comingSoon('FIRST_AID_KIT', 'La orientación sobre el botiquín', 'Botiquín');
    return build('first_aid_kit', 'ok', 'Un botiquín básico suele incluir material de curación (gasas, vendas, antiséptico), termómetro, guantes y los medicamentos que tu médico te haya indicado, revisando fechas de vencimiento. En la sección “Botiquín” de MediCore encuentras listas de revisión por tipo de kit. En una emergencia, llama al 123.', { sources: S('minsalud'), actions: ['Abrir la sección Botiquín'] });
  }
  return null;
}

// Preguntas comerciales: aunque nombren un medicamento del catálogo, no son de información (OOS_COMMERCIAL)
const COMMERCIAL = /cuesta|precio|cuanto vale|cuanto sale|mas barato|donde (lo |la )?(compro|consigo|venden|encuentro)|comprar|disponib|descuento|(marca|generico).{0,25}(mejor|recomend)|cual es mejor/;
// Parece una pregunta de información de medicamento (MED_NOT_FOUND si no está en el catálogo)
const MED_QUESTION = /para que (sirve|se usa|es)|contraindic|precauc|informacion (de|del|de la|sobre)|hablame (de|del|sobre)|que (sabes|me dices) (de|del|sobre)/;

function commercial() {
  return build('out_of_scope', 'ok', 'No manejo precios, compra ni disponibilidad de medicamentos: mi catálogo solo tiene información general (para qué sirven, cuándo se usan y sus precauciones). Para precios o dónde conseguirlos, consulta en una farmacia.', { flags: ['oos_commercial'], actions: ['Consultar en una farmacia'] });
}

function notFound() {
  const examples = ['Ibuprofeno', 'Loratadina', 'Omeprazol'].filter((n) => catalog.meds.some((m) => m.n === n));
  return build(
    'medication_not_found',
    'ok',
    `No encontré ese medicamento en el catálogo de MediCore, así que no tengo información para darte. Revisa la ortografía o prueba con el nombre genérico${examples.length ? ` (por ejemplo: ${examples.join(', ')})` : ''}. Para cualquier medicamento, el prospecto y tu farmacéutico son la fuente confiable.`,
    { flags: ['medication_not_in_catalog'], actions: ['Revisar la ortografía', 'Consultar a un farmacéutico'] }
  );
}

function fallback() {
  return build(
    'out_of_scope',
    'ok',
    'Por ahora (prototipo) solo puedo darte información general sobre los medicamentos del catálogo de MediCore: para qué sirven, cuándo se usan y sus precauciones. No diagnostico ni receto. Prueba preguntando, por ejemplo: “¿Para qué sirve la loratadina?”.',
    { actions: ['Reformular la pregunta', 'Consultar a un profesional de la salud'] }
  );
}

/**
 * Respuesta controlada (determinista). Es también el respaldo cuando no hay IA
 * o cuando la salida de la IA incumple el filtro de seguridad.
 * `scope` define qué intenciones están activas (ver intents.js). Por defecto: fase 1.
 */
function controlledReply(message, scope = SCOPE.PHASE1) {
  switch (classifySafety(message)) {
    case 'emergency': return emergency();
    case 'self_harm': return selfHarm();
    case 'prompt_injection': return injection();
    case 'diagnosis': return diagnosis(message);
    case 'prescription': return prescription(message);
  }
  // Interacciones entre medicamentos (issue #64): siempre determinista, nunca delegada a IA
  if (needsProfessionalOnly(normalize(message))) return prescription(message);
  const inter = interactionAnswer(message, catalog.meds);
  if (inter) return build(inter.category, inter.level, inter.reply, { flags: inter.flags, sources: S(...inter.sources), actions: inter.actions });
  const norm = normalize(message);
  const med = findMedication(message, catalog.meds);
  if (med) return COMMERCIAL.test(norm) ? commercial() : medicationInfo(med);
  const topic = generalTopics(message, scope);
  if (topic) return topic;
  if (MED_QUESTION.test(norm)) return notFound();
  return fallback();
}

module.exports = { controlledReply, DISCLAIMER, catalog, scopeFromEnv };
