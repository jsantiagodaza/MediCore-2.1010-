'use strict';
/**
 * Consultas sobre interacciones entre medicamentos (issue #64).
 *
 * Principios (ver docs/ai-safety.md):
 *   - 100 % determinista: la IA nunca interviene aquí.
 *   - Solo se afirma lo que está en la tabla RULES (interacciones ampliamente documentadas).
 *     Si un par no está en la tabla NO se inventa nada y tampoco se garantiza seguridad.
 *   - Nunca se dan dosis, horarios ni se recomienda iniciar, suspender o modificar tratamientos.
 *   - Siempre se remite a un médico o farmacéutico.
 *
 * ESTADO: la tabla es un recorte conservador del catálogo interno (MVP). NO ha sido revisada
 * clínicamente: debe validarla un profesional de farmacia antes de pasar de prototipo.
 */
const { normalize } = require('./safety');
const { SOURCES } = require('./knowledge');

// ─────────────────────────── Perfiles farmacológicos ───────────────────────────
// Clave = nombre en el catálogo (js/data.js). `ing` = principio activo; `cls` = clases.
const P = (ing, ...cls) => ({ ing, cls });
const PROFILES = {
  'Acetaminofén': P('acetaminofen'),
  'Cafeína + Acetaminofén': P('acetaminofen'),
  'Ibuprofeno': P('ibuprofeno', 'aine'),
  'Naproxeno': P('naproxeno', 'aine'),
  'Diclofenaco': P('diclofenaco', 'aine'),
  'Ketorolaco': P('ketorolaco', 'aine'),
  'Meloxicam': P('meloxicam', 'aine'),
  'Celecoxib': P('celecoxib', 'aine'),
  'Aspirina': P('aspirina', 'aine', 'antiagregante'),
  'Metamizol': P('metamizol'),
  'Metamisol (Dipirona)': P('metamizol'),
  'Warfarina': P('warfarina', 'anticoagulante'),
  'Enalapril': P('enalapril', 'ieca_ara'),
  'Losartán': P('losartan', 'ieca_ara'),
  'Furosemida': P('furosemida', 'diuretico'),
  'Espironolactona': P('espironolactona', 'diuretico', 'ahorrador_potasio'),
  'Sertralina': P('sertralina', 'isrs', 'serotoninergico'),
  'Fluoxetina': P('fluoxetina', 'isrs', 'serotoninergico'),
  'Tramadol': P('tramadol', 'serotoninergico', 'sedante', 'opioide'),
  'Alprazolam': P('alprazolam', 'benzodiacepina', 'sedante'),
  'Clonazepam': P('clonazepam', 'benzodiacepina', 'sedante'),
  'Pregabalina': P('pregabalina', 'sedante'),
  'Gabapentina': P('gabapentina', 'sedante'),
  'Quetiapina': P('quetiapina', 'sedante'),
  'Difenhidramina': P('difenhidramina', 'sedante'),
  'Hidroxizina': P('hidroxizina', 'sedante'),
  'Prednisona': P('prednisona', 'corticoide'),
  'Claritromicina': P('claritromicina'),
  'Atorvastatina': P('atorvastatina'),
  'Colchicina': P('colchicina'),
  'Ciprofloxacino': P('ciprofloxacino', 'quinolona'),
  'Doxiciclina': P('doxiciclina', 'tetraciclina'),
  'Levotiroxina': P('levotiroxina'),
  'Metronidazol': P('metronidazol'),
  'Fluconazol': P('fluconazol'),
  'Glibenclamida': P('glibenclamida'),
  'Vitamina K2': P('vitamina k'),
  'Calcio + Vitamina D': P('calcio', 'cation'),
  'Hierro (Sulfato ferroso)': P('hierro', 'cation'),
  'Magnesio': P('magnesio', 'cation'),
  'Magnesio glicinato': P('magnesio', 'cation'),
  'Zinc': P('zinc', 'cation'),
  'Sucralfato': P('sucralfato', 'cation')
};

// ─────────────────────────── Interacciones documentadas ────────────────────────
// a / b: 'ing:xxx' (principio activo) o 'cls:xxx' (clase). `level`: importante | moderada | duplicidad.
// Los textos NO contienen dosis, horarios ni órdenes de iniciar/suspender/cambiar tratamiento.
const R = (a, b, level, what, why) => ({ a, b, level, what, why });
const RULES = [
  R('cls:aine', 'ing:warfarina', 'importante',
    'Aumenta el riesgo de sangrado.',
    'Los antiinflamatorios pueden irritar el estómago y afectar la coagulación, y la warfarina ya reduce la coagulación.'),
  R('ing:aspirina', 'ing:warfarina', 'importante',
    'Aumenta el riesgo de sangrado.',
    'Ambos afectan la coagulación por mecanismos distintos y sus efectos se suman.'),
  R('cls:aine', 'cls:aine', 'duplicidad',
    'Usar dos antiinflamatorios a la vez suma efectos adversos (estómago, riñón, presión) sin una ventaja clara.',
    'Pertenecen a la misma familia de medicamentos (AINE) y actúan por el mismo mecanismo.'),
  R('cls:aine', 'cls:ieca_ara', 'importante',
    'Puede afectar la función del riñón y disminuir el efecto del medicamento para la presión.',
    'Los antiinflamatorios reducen el flujo de sangre al riñón, lo que pesa más cuando se usan antihipertensivos como enalapril o losartán.'),
  R('cls:aine', 'cls:diuretico', 'moderada',
    'Puede afectar el riñón y disminuir el efecto del diurético.',
    'Los antiinflamatorios hacen que el cuerpo retenga sodio y agua y reducen el flujo de sangre al riñón.'),
  R('cls:aine', 'cls:corticoide', 'importante',
    'Aumenta el riesgo de irritación, úlcera y sangrado en el estómago.',
    'Tanto los antiinflamatorios como los corticoides pueden dañar la mucosa gástrica.'),
  R('cls:aine', 'cls:isrs', 'moderada',
    'Aumenta el riesgo de sangrado, sobre todo digestivo.',
    'Los antidepresivos tipo ISRS afectan la función de las plaquetas, y los antiinflamatorios dañan la mucosa del estómago.'),
  R('cls:ieca_ara', 'cls:ahorrador_potasio', 'importante',
    'Puede subir el potasio en sangre a niveles peligrosos.',
    'Ambos retienen potasio; el riesgo es mayor si hay enfermedad renal y suele requerir control con análisis de sangre.'),
  R('ing:acetaminofen', 'ing:acetaminofen', 'duplicidad',
    'Son el mismo principio activo (acetaminofén): usar ambos duplica la cantidad total y puede dañar el hígado.',
    '“Cafeína + Acetaminofén” ya contiene acetaminofén. Revisa siempre los ingredientes en el empaque.'),
  R('ing:metamizol', 'ing:metamizol', 'duplicidad',
    'Metamizol y Metamisol (Dipirona) son el mismo medicamento con distinto nombre; usar ambos duplica el efecto y los riesgos.',
    'Es el mismo principio activo con dos nombres.'),
  R('cls:isrs', 'cls:isrs', 'importante',
    'Combinar dos antidepresivos ISRS aumenta el riesgo de síndrome serotoninérgico.',
    'Ambos elevan la serotonina; en exceso puede causar agitación, temblor, fiebre y otros síntomas serios.'),
  R('cls:isrs', 'ing:tramadol', 'importante',
    'Aumenta el riesgo de síndrome serotoninérgico y de convulsiones.',
    'Tanto los ISRS como el tramadol actúan sobre la serotonina, y el tramadol además puede bajar el umbral de convulsiones.'),
  R('cls:isrs', 'ing:warfarina', 'importante',
    'Puede aumentar el riesgo de sangrado.',
    'Los ISRS afectan las plaquetas y pueden alterar el efecto de la warfarina.'),
  R('cls:benzodiacepina', 'cls:opioide', 'importante',
    'Puede causar somnolencia intensa y depresión respiratoria.',
    'Ambos deprimen el sistema nervioso central y sus efectos se suman; es una combinación con advertencia formal de las agencias reguladoras.'),
  R('cls:sedante', 'cls:sedante', 'moderada',
    'Se suman los efectos sedantes: somnolencia, mareo, torpeza y menor capacidad para conducir o manejar maquinaria.',
    'Ambos medicamentos actúan deprimiendo el sistema nervioso central.'),
  R('ing:claritromicina', 'ing:atorvastatina', 'importante',
    'Puede aumentar los niveles de la estatina y el riesgo de daño muscular.',
    'La claritromicina frena la enzima del hígado que elimina la atorvastatina.'),
  R('ing:claritromicina', 'ing:colchicina', 'importante',
    'Puede elevar los niveles de colchicina hasta niveles tóxicos.',
    'La claritromicina reduce la eliminación de la colchicina; el riesgo es mayor con enfermedad renal o hepática.'),
  R('ing:claritromicina', 'ing:warfarina', 'importante',
    'Puede aumentar el efecto anticoagulante y el riesgo de sangrado.',
    'Algunos antibióticos alteran el metabolismo de la warfarina.'),
  R('ing:ciprofloxacino', 'ing:warfarina', 'moderada',
    'Puede aumentar el efecto anticoagulante y el riesgo de sangrado.',
    'Algunos antibióticos alteran el metabolismo de la warfarina y exigen control del INR.'),
  R('ing:metronidazol', 'ing:warfarina', 'importante',
    'Puede aumentar notablemente el efecto anticoagulante y el riesgo de sangrado.',
    'El metronidazol interfiere con el metabolismo de la warfarina.'),
  R('ing:fluconazol', 'ing:warfarina', 'importante',
    'Puede aumentar notablemente el efecto anticoagulante y el riesgo de sangrado.',
    'El fluconazol frena la enzima que elimina la warfarina.'),
  R('ing:fluconazol', 'ing:glibenclamida', 'moderada',
    'Puede aumentar el efecto de la glibenclamida y causar bajadas de azúcar (hipoglucemia).',
    'El fluconazol reduce la eliminación de la glibenclamida.'),
  R('ing:vitamina k', 'ing:warfarina', 'importante',
    'La vitamina K se opone al efecto de la warfarina y puede disminuir su protección.',
    'La warfarina actúa bloqueando la vitamina K; un aporte extra cambia su efecto y por eso su control es tan cuidadoso.'),
  R('cls:cation', 'cls:quinolona', 'moderada',
    'Los minerales (calcio, hierro, magnesio, zinc) se unen al antibiótico y pueden reducir mucho su absorción, con riesgo de que no funcione bien.',
    'Las quinolonas forman complejos con estos minerales en el intestino.'),
  R('cls:cation', 'cls:tetraciclina', 'moderada',
    'Los minerales (calcio, hierro, magnesio, zinc) se unen al antibiótico y pueden reducir su absorción.',
    'Las tetraciclinas forman complejos con estos minerales en el intestino.'),
  R('cls:cation', 'ing:levotiroxina', 'moderada',
    'Calcio, hierro y magnesio pueden reducir la absorción de la levotiroxina y desajustar el control de la tiroides.',
    'Estos minerales se unen a la hormona en el intestino.'),
  R('ing:sucralfato', 'cls:quinolona', 'moderada',
    'El sucralfato puede reducir la absorción del antibiótico.',
    'El sucralfato contiene aluminio, que forma complejos con las quinolonas.')
];

const tags = (name) => {
  const p = PROFILES[name];
  return p ? new Set([`ing:${p.ing}`, ...p.cls.map((c) => `cls:${c}`)]) : new Set();
};

/** Reglas que aplican al par (a, b), de mayor a menor relevancia. Una regla con los dos lados iguales exige dos medicamentos distintos. */
function findInteractions(medA, medB) {
  const ta = tags(medA.n);
  const tb = tags(medB.n);
  const order = { importante: 0, moderada: 1, duplicidad: 2 };
  return RULES.filter((r) => (ta.has(r.a) && tb.has(r.b)) || (ta.has(r.b) && tb.has(r.a))).sort((x, y) => order[x.level] - order[y.level]);
}

// ─────────────────────────── Reconocimiento de medicamentos ────────────────────
// Marcas y nombres comunes SOLO para esta función (no cambia la búsqueda de fichas).
const BRANDS = {
  dolex: 'Acetaminofén', paracetamol: 'Acetaminofén', tylenol: 'Acetaminofén',
  advil: 'Ibuprofeno', motrin: 'Ibuprofeno', brufen: 'Ibuprofeno',
  voltaren: 'Diclofenaco', coumadin: 'Warfarina', prozac: 'Fluoxetina', zoloft: 'Sertralina',
  xanax: 'Alprazolam', rivotril: 'Clonazepam', ventolin: 'Salbutamol', 'acido acetilsalicilico': 'Aspirina',
  dipirona: 'Metamisol (Dipirona)', calcio: 'Calcio + Vitamina D', 'vitamina d': 'Vitamina D3', 'vitamina k': 'Vitamina K2',
  'vitamina b12': 'Vitamina B12 (Cianocobalamina)'
};

// Términos genéricos que NO identifican un medicamento: se pide aclaración.
const AMBIGUOUS = [
  { re: /\b(antiinflamatorios?|aines?)\b/, label: 'antiinflamatorio', options: ['Ibuprofeno', 'Naproxeno', 'Diclofenaco', 'Meloxicam', 'Ketorolaco', 'Celecoxib', 'Aspirina'] },
  { re: /\bantibioticos?\b/, label: 'antibiótico', options: ['Amoxicilina', 'Azitromicina', 'Ciprofloxacino', 'Claritromicina', 'Doxiciclina', 'Metronidazol'] },
  { re: /\bantidepresivos?\b/, label: 'antidepresivo', options: ['Sertralina', 'Fluoxetina'] },
  { re: /\b(ansioliticos?|benzodiacepinas?|benzodiazepinas?)\b/, label: 'ansiolítico', options: ['Alprazolam', 'Clonazepam'] },
  { re: /\bantihistaminicos?\b/, label: 'antihistamínico', options: ['Loratadina', 'Cetirizina', 'Desloratadina', 'Fexofenadina', 'Difenhidramina'] },
  { re: /\bdiureticos?\b/, label: 'diurético', options: ['Furosemida', 'Espironolactona'] },
  { re: /\banticoagulantes?\b/, label: 'anticoagulante', options: ['Warfarina'] },
  { re: /\b(analgesicos?|calmantes?)\b/, label: 'analgésico', options: ['Acetaminofén', 'Ibuprofeno', 'Naproxeno', 'Diclofenaco', 'Tramadol'] },
  { re: /\binsulinas?\b(?!\s+nph)/, label: 'insulina', options: ['Insulina NPH'] },
  { re: /\bvitaminas?\b(?!\s+(a|b\d*|c|d3?|k2?)\b)/, label: 'vitamina', options: ['Vitamina A', 'Vitamina B12 (Cianocobalamina)', 'Vitamina C', 'Vitamina D3', 'Vitamina K2'] }
];

const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function termsFor(med) {
  const full = normalize(med.n);
  const out = new Set([full]);
  out.add(full.replace(/ \(.*\)$/, '')); // «metamisol (dipirona)» -> «metamisol»
  const paren = full.match(/\((.+)\)/);
  if (paren) out.add(paren[1]);
  full.split('/').forEach((x) => out.add(x.trim())); // «trimetoprim/sulfametoxazol»
  out.add(full.replace(/ (crema|colirio|ungueno|suspension|inhalada|nasal|pasta)$/, ''));
  return [...out].filter((t) => t.length >= 4);
}

/**
 * Medicamentos del catálogo mencionados (sin repetir ni solapar: «esomeprazol» no cuenta como «omeprazol»)
 * y términos ambiguos que requieren aclaración.
 */
function findMentions(message, meds) {
  let text = ` ${normalize(message)} `;
  const candidates = [];
  for (const m of meds) for (const t of termsFor(m)) candidates.push({ m, t });
  for (const [brand, target] of Object.entries(BRANDS)) {
    const m = meds.find((x) => x.n === target);
    if (m) candidates.push({ m, t: brand });
  }
  candidates.sort((a, b) => b.t.length - a.t.length); // el más largo primero
  const hits = [];
  for (const { m, t } of candidates) {
    const re = new RegExp(`(?<![a-z0-9])${esc(t)}(?![a-z0-9])`);
    const hit = re.exec(text);
    if (hit) {
      text = text.replace(re, ' ');
      if (!hits.some((h) => h.m === m)) hits.push({ m, at: hit.index });
    }
  }
  const found = hits.sort((x, y) => x.at - y.at).map((h) => h.m); // en el orden en que la persona los nombró
  const ambiguous = AMBIGUOUS.filter((g) => g.re.test(text) && !g.options.some((o) => found.some((m) => m.n === o))).map(({ label, options }) => ({ label, options }));
  return { meds: found, ambiguous };
}

// ─────────────────────────── ¿Es una pregunta de interacciones? ────────────────
const GENERIC_DRUG_WORD = /\b(medicamentos?|medicinas?|pastillas?|pastas|tabletas?|capsulas?|jarabes?|tratamientos?)\b/;
const CUE = [
  /interaccion|interactu|interactua/,
  /\b(mezclar|combinar|juntar|mezcla|combinacion)\b/,
  /(tomo|tomando|toma|tomaba|uso|usando|me (recetaron|mandaron|formularon)|estoy con|llevo).{0,90}(tambien|ademas|junto|a la vez|al mismo tiempo|encima)/,
  /(problema|riesgo|peligro|peligroso|malo|grave|dano|danino|seguro|compatibles?|incompatibles?|pasa algo|pasaria algo|afecta|interfiere).{0,70}(tambien|junto|con |mezcl|combin|si tomo|si uso|si me tomo|a la vez|al mismo tiempo)/,
  /(puedo|podria|se puede|se pueden|es posible|debo|deberia|conviene).{0,15}(tomar|tomarlo|tomarla|tomarlos|tomarlas|usar|usarlo|usarla|aplicar).{0,70}(con |junto|a la vez|al mismo tiempo|ademas|tambien| y )/,
  /(tomar|usar|tomo|uso).{0,50}(junto con|a la vez|al mismo tiempo)/,
  /(puedo|podria).{0,15}(tomar|usar).{0,30}(algo mas|otra cosa|otro medicamento|otra pastilla|otra medicina)/
];
const isInteractionCue = (norm) => CUE.some((re) => re.test(norm));
// Niños, embarazo, lactancia y adultos mayores: no se evalúan combinaciones, se remite a un profesional (DOSAGE_OR_PRESCRIPTION)
const SPECIAL_POPULATION = /\b(hij[oa]s?|bebes?|ninos?|ninas?|recien nacid[oa]s?|embarazad[oa]|embarazo|lactancia|lactando|anciano|abuel[oa]s?|adulto mayor)\b/;
const needsProfessionalOnly = (norm) => isInteractionCue(norm) && SPECIAL_POPULATION.test(norm);

// ─────────────────────────── Respuestas ────────────────────────────────────────
const ADVICE =
  'Antes de combinarlos, consulta a tu médico o farmacéutico, que conocen tu caso (edad, otras enfermedades, dosis y demás medicamentos). Si ya los usas, no cambies ni suspendas ningún tratamiento por tu cuenta sin hablar con ellos.';
const WARNING_SIGNS = 'Si notas síntomas importantes o inusuales (sangrado, dificultad para respirar, hinchazón de cara o labios, confusión o somnolencia extrema), busca atención médica de inmediato o llama al 123.';
const LEVEL_TEXT = {
  importante: 'interacción documentada de relevancia importante',
  moderada: 'interacción documentada de relevancia moderada',
  duplicidad: 'duplicidad: son el mismo tipo de medicamento (o el mismo principio activo)'
};

function documentedReply(a, b, rules) {
  const top = rules[0];
  const lines = [`Entre ${a.n} y ${b.n} hay una ${LEVEL_TEXT[top.level]}.`, '', ...rules.slice(0, 2).map((r) => `• ${r.what} ${r.why}`)];
  lines.push('', ADVICE);
  if (top.level !== 'duplicidad') lines.push(WARNING_SIGNS);
  lines.push('', 'Esto es información general: no evalúa tu caso y mi lista de interacciones es limitada, así que su ausencia nunca significa que una combinación sea segura.');
  return {
    category: 'drug_interaction',
    level: 'ok',
    flags: ['interaction:documented', `interaction_level:${top.level}`],
    reply: lines.join('\n'),
    sources: ['catalog', 'medline', 'invima'],
    actions: ['Consultar a un farmacéutico o médico antes de combinarlos', 'Leer el prospecto de ambos']
  };
}

function notDocumentedReply(a, b) {
  return {
    category: 'drug_interaction',
    level: 'ok',
    flags: ['interaction:not_documented'],
    reply: [
      `No tengo registrada en mi base una interacción documentada entre ${a.n} y ${b.n}.`,
      '',
      'Eso NO significa que sea seguro combinarlos: mi base es limitada y puede haber interacciones que no conozco o que dependen de tu caso (edad, enfermedades, dosis, otros medicamentos).',
      '',
      ADVICE
    ].join('\n'),
    sources: ['catalog', 'medline', 'invima'],
    actions: ['Consultar a un farmacéutico o médico', 'Leer el prospecto de ambos']
  };
}

const list = (xs) => xs.join(', ');

function clarification(kind, reply, extraFlags = []) {
  return {
    category: 'interaction_clarification',
    level: 'ok',
    flags: [`interaction:${kind}`, ...extraFlags],
    reply,
    sources: [],
    actions: ['Indicar el nombre exacto de los medicamentos']
  };
}

/** Decide qué responder a una consulta de interacciones. Devuelve null si el mensaje no lo es. */
function interactionAnswer(message, meds) {
  const norm = normalize(message);
  if (!isInteractionCue(norm)) return null;
  const { meds: found, ambiguous } = findMentions(message, meds);
  // Sin ningún medicamento ni término genérico, solo cuenta si habla claramente de medicamentos
  if (!found.length && !ambiguous.length && !(GENERIC_DRUG_WORD.test(norm) && /interaccion|interactu|mezclar|combinar/.test(norm))) return null;

  if (ambiguous.length) {
    const g = ambiguous[0];
    return clarification(
      'ambiguous',
      `Mencionas un “${g.label}”, pero ese nombre no identifica un medicamento concreto y no quiero adivinar. ¿Cuál es exactamente? En el catálogo de MediCore tengo, por ejemplo: ${list(g.options)}. Si no aparece, dime el nombre genérico que figura en el empaque.`,
      ['needs_clarification']
    );
  }
  if (found.length >= 3) {
    return clarification(
      'too_many',
      `Veo varios medicamentos (${list(found.slice(0, 4).map((m) => m.n))}). Evalúo las interacciones de dos en dos para no equivocarme: dime cuáles dos quieres revisar. Si tomas varios a la vez, tu farmacéutico puede revisar la combinación completa.`,
      ['needs_clarification']
    );
  }
  if (found.length === 2) {
    const [a, b] = found;
    const rules = findInteractions(a, b);
    return rules.length ? documentedReply(a, b, rules) : notDocumentedReply(a, b);
  }
  if (found.length === 1) {
    return clarification(
      'missing_second',
      `Reconocí ${found[0].n}. Para revisar una interacción necesito el nombre del otro medicamento (mejor el nombre genérico del empaque). Si no está en el catálogo de MediCore no podré darte información: en ese caso, tu farmacéutico es la fuente confiable.`,
      ['needs_clarification']
    );
  }
  return clarification(
    'missing_both',
    'Puedo revisar posibles interacciones entre dos medicamentos del catálogo de MediCore. Dime los nombres de ambos (mejor el nombre genérico que figura en el empaque), por ejemplo: “¿Hay problema si tomo ibuprofeno y warfarina?”.',
    ['needs_clarification']
  );
}

module.exports = { interactionAnswer, needsProfessionalOnly, findInteractions, findMentions, isInteractionCue, PROFILES, RULES, SOURCES_USED: ['catalog', 'medline', 'invima'].map((k) => SOURCES[k]) };
