'use strict';
/**
 * Capa de seguridad determinista del asistente MediCore.
 * Se ejecuta SIEMPRE antes de cualquier respuesta (controlada o de IA).
 * Los casos de emergencia / autolesión / diagnóstico / prescripción NUNCA se delegan a un modelo.
 */

const normalize = (s) =>
  String(s)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();

const RULES = {
  emergency: [
    /dolor (de |en el |en mi )?(pecho|torax)/,
    /(no puedo|dificultad (para|al)) respirar|me ahogo|falta de aire (intensa|severa|fuerte)/,
    /perdi (el )?conocimiento|inconsciente|no reacciona|me desmaye|se desmayo/,
    /convulsi/,
    /hemorragia|sangrado (abundante|severo|fuerte|que no (para|se detiene))/,
    /(vomito|vomitando|tos) (con )?sangre|sangre en (las )?(heces|orina)|heces negras/,
    /(cara|labios|lengua|garganta) (hinchad|inflamad)|(hincharon|inflamaron) (la |los |mi |las )?(cara|labios|lengua|garganta)|hinchazon (de |en )?(la )?(cara|lengua|garganta|labios)|anafila/,
    /sobredosis|intoxicacion|envenen|me tome (todas|muchas|un monton)/,
    /cara caida|no puedo (mover|hablar)|habla (arrastrada|confusa)|derrame|paralisis/,
    /(bebe|recien nacido).*(fiebre|no respira|morado)/
  ],
  self_harm: [
    /suicid|quitarme la vida|quiero morir|no quiero vivir|acabar con mi vida|hacerme dano|hacerme algo malo/
  ],
  prompt_injection: [
    /ignora (todas )?(tus|las) (instrucciones|reglas)|olvida (tus|las) (instrucciones|reglas)/,
    /(muestra|dime|revela|imprime).{0,30}(system prompt|prompt del sistema|instrucciones internas|api ?key|clave)/,
    /actua como (un )?(medico|doctor)|modo (desarrollador|sin restricciones)|jailbreak|ignore (all )?(previous|prior) instructions/
  ],
  diagnosis: [
    /diagnostic(a|ame|o)|que (enfermedad|tengo|me pasa|podria tener|puedo tener)|cual es mi enfermedad/,
    /\b(tengo|tendre|sera) (cancer|covid|dengue|diabetes|vih|neumonia|infarto|apendicitis)/,
    /es grave\b|me estoy muriendo|estoy enferm[oa] de/
  ],
  prescription: [
    /\bdosis\b|cuant[oa]s?\b(?!.*\b(agua|liquidos?|litros|vasos)\b).{0,40}\b(tomar|tomo|aplicar|aplico|darle|dar)\b|cada cuantas horas|cuantas (pastillas|tabletas|gotas)/,
    /recetame|formulame|recomiendame (un )?(medicamento|antibiotico|pastilla)|que (medicamento|pastilla|antibiotico) (me )?(tomo|debo tomar|puedo tomar)|que me (tomo|recomiendas tomar)/,
    /puedo (tomar|mezclar|combinar).{0,40}(con|junto)|mezclar .* con|combinar .* con/,
    /(para|a) (mi )?(hij[oa]|bebe|nino|nina|embarazada|mama|papa|abuel[oa])\b.*(tomar|dar|darle|medicamento|pastilla)/,
    /(estoy|esta) (embarazada|lactando)/
  ]
};

/** Devuelve la categoría de seguridad más prioritaria o null. Orden = prioridad. */
function classifySafety(message) {
  const text = normalize(message);
  for (const category of ['emergency', 'self_harm', 'prompt_injection', 'diagnosis', 'prescription']) {
    if (RULES[category].some((re) => re.test(text))) return category;
  }
  return null;
}

/**
 * Filtro de salida para respuestas generadas por IA.
 * Devuelve lista de violaciones; si no está vacía se descarta la respuesta de la IA.
 */
const OUTPUT_VIOLATIONS = [
  ['dosage', /\b\d+([.,]\d+)?\s?(mg|mcg|ml|g|ui|gotas|tabletas|pastillas|comprimidos)\b.{0,40}(cada|al dia|por dia|veces)/i],
  ['dosage', /\b(tome|toma|tomar|administre|aplique)\b.{0,25}\b\d+/i],
  ['diagnosis', /\b(tienes|tiene|padeces|padece|sufres de)\s+(una |un |la |el )?(gripe|covid|dengue|infeccion|cancer|diabetes|neumonia|gastroenteritis|alergia)/i],
  ['diagnosis', /\b(diagnostico|diagnosticad[oa]).{0,15}(es|:)/i],
  ['prescription', /\b(te|le) (receto|prescribo|recomiendo (tomar|que tome))\b/i]
];

function checkOutput(reply) {
  const text = normalize(reply);
  return OUTPUT_VIOLATIONS.filter(([, re]) => re.test(text)).map(([name]) => name);
}

module.exports = { normalize, classifySafety, checkOutput };
