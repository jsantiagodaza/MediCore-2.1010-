'use strict';
// Issue #64 — consultas sobre interacciones entre medicamentos
const test = require('node:test');
const assert = require('node:assert/strict');
const { controlledReply, catalog } = require('../server/assistant/engine');
const { handleMessage } = require('../server/handler');
const { checkOutput } = require('../server/assistant/safety');
const { findMentions, findInteractions, PROFILES, RULES } = require('../server/assistant/interactions');

const byName = (n) => catalog.meds.find((m) => m.n === n);
const ask = (q) => controlledReply(q);

// ---- Integridad de la tabla ----
test('todos los perfiles existen en el catálogo', () => {
  for (const name of Object.keys(PROFILES)) assert.ok(byName(name), `«${name}» no está en el catálogo`);
});
test('cada regla usa etiquetas que existen en algún perfil (sin errores de tipeo)', () => {
  const known = new Set();
  for (const p of Object.values(PROFILES)) { known.add(`ing:${p.ing}`); p.cls.forEach((c) => known.add(`cls:${c}`)); }
  for (const r of RULES) for (const t of [r.a, r.b]) assert.ok(known.has(t), `etiqueta desconocida ${t}`);
});
test('los textos de las reglas no contienen cifras, dosis ni órdenes de iniciar/suspender', () => {
  for (const r of RULES) {
    const text = `${r.what} ${r.why}`;
    assert.doesNotMatch(text, /\d/, text);
    assert.deepEqual(checkOutput(text), [], text);
    assert.doesNotMatch(text.toLowerCase(), /\b(deja de|suspende|suspenda|empieza a|inicia|evita|no tomes|toma)\b/, text);
  }
});
test('la búsqueda de interacciones es simétrica', () => {
  const a = byName('Ibuprofeno');
  const b = byName('Warfarina');
  assert.equal(findInteractions(a, b).length > 0, true);
  assert.deepEqual(findInteractions(a, b), findInteractions(b, a));
});

// ---- Reconocimiento de medicamentos ----
test('reconoce genéricos y marcas, sin confundir esomeprazol con omeprazol', () => {
  assert.deepEqual(findMentions('tomo Advil y Dolex', catalog.meds).meds.map((m) => m.n), ['Ibuprofeno', 'Acetaminofén']);
  assert.deepEqual(findMentions('esomeprazol y warfarina', catalog.meds).meds.map((m) => m.n), ['Esomeprazol', 'Warfarina']);
  assert.deepEqual(findMentions('Cafeína + Acetaminofén', catalog.meds).meds.map((m) => m.n), ['Cafeína + Acetaminofén']);
});
test('detecta nombres ambiguos', () => {
  assert.equal(findMentions('un antiinflamatorio', catalog.meds).ambiguous[0].label, 'antiinflamatorio');
  assert.equal(findMentions('vitamina', catalog.meds).ambiguous[0].label, 'vitamina');
  assert.equal(findMentions('vitamina c', catalog.meds).ambiguous.length, 0);
});

// ---- Respuestas: interacción documentada ----
const DOCUMENTED = [
  ['Estoy tomando warfarina. ¿Hay algún problema si también tomo ibuprofeno?', 'Warfarina', 'Ibuprofeno', 'importante'],
  ['¿Puedo tomar ibuprofeno con enalapril?', 'Ibuprofeno', 'Enalapril', 'importante'],
  ['¿Es seguro tomar sertralina con tramadol?', 'Sertralina', 'Tramadol', 'importante'],
  ['¿Puedo tomar ciprofloxacino con calcio?', 'Ciprofloxacino', 'Calcio', 'moderada'],
  ['¿Puedo tomar Advil con aspirina?', 'Ibuprofeno', 'Aspirina', 'duplicidad'],
  ['¿Qué interacción hay entre paracetamol y Cafeína + Acetaminofén?', 'Acetaminofén', 'Cafeína', 'duplicidad']
];
for (const [q, a, b, level] of DOCUMENTED) {
  test(`documentada (${level}): «${q}»`, () => {
    const r = ask(q);
    assert.equal(r.category, 'drug_interaction');
    assert.ok(r.safety.flags.includes('interaction:documented'));
    assert.ok(r.safety.flags.includes(`interaction_level:${level}`), r.safety.flags.join());
    assert.match(r.reply, new RegExp(a));
    assert.match(r.reply, new RegExp(b));
  });
}

// ---- Respuestas: sin dato documentado (no inventar, no garantizar seguridad) ----
test('par sin interacción documentada: no inventa y aclara que no garantiza seguridad', () => {
  const r = ask('¿Puedo tomar loratadina con omeprazol?');
  assert.equal(r.category, 'drug_interaction');
  assert.ok(r.safety.flags.includes('interaction:not_documented'));
  assert.match(r.reply, /no tengo registrada/i);
  assert.match(r.reply, /NO significa que sea seguro/);
  assert.doesNotMatch(r.reply, /relevancia (importante|moderada)/);
});

// ---- Respuestas: aclaraciones ----
test('nombre ambiguo: pide aclaración y lista opciones del catálogo', () => {
  const r = ask('Tomo un antiinflamatorio, ¿puedo tomar warfarina también?');
  assert.equal(r.category, 'interaction_clarification');
  assert.match(r.reply, /Ibuprofeno/);
});
test('un solo medicamento: pide el otro', () => {
  const r = ask('¿Puedo mezclar ibuprofeno con otro medicamento?');
  assert.equal(r.category, 'interaction_clarification');
  assert.ok(r.safety.flags.includes('interaction:missing_second'));
});
test('ningún medicamento: pide los nombres', () => {
  const r = ask('¿Puedo mezclar medicamentos?');
  assert.equal(r.category, 'interaction_clarification');
  assert.ok(r.safety.flags.includes('interaction:missing_both'));
});
test('tres o más medicamentos: pide elegir dos', () => {
  const r = ask('Tomo ibuprofeno, paracetamol y naproxeno, ¿hay interacción?');
  assert.ok(r.safety.flags.includes('interaction:too_many'));
});

// ---- Seguridad: prevalece sobre las interacciones ----
test('embarazo, niños y pedidos de dosis siguen siendo prescription_refused', () => {
  for (const q of ['Estoy embarazada, ¿puedo tomar ibuprofeno con aspirina?', 'Mi hijo toma ibuprofeno, ¿puedo darle también aspirina?', '¿Cuántas pastillas de ibuprofeno y aspirina puedo tomar juntas?'])
    assert.equal(ask(q).category, 'prescription_refused', q);
});
test('emergencia y autolesión siguen primero', () => {
  assert.equal(ask('Tomé ibuprofeno con aspirina y tengo dolor de pecho').category, 'emergency');
  assert.equal(ask('Quiero quitarme la vida con ibuprofeno y aspirina, ¿se pueden mezclar?').category, 'self_harm');
});
test('preguntas que no son de medicamentos no activan el flujo', () => {
  assert.equal(ask('¿Es malo comer con hambre?').category, 'out_of_scope');
  assert.equal(ask('¿Para qué sirve la loratadina?').category, 'medication_info');
});

// ---- Garantías de salida para TODAS las respuestas de interacción ----
test('ninguna respuesta de interacción da dosis ni ordena iniciar/suspender; siempre remite a un profesional', () => {
  const queries = [...DOCUMENTED.map((d) => d[0]), '¿Puedo tomar loratadina con omeprazol?'];
  for (const q of queries) {
    const r = ask(q);
    assert.deepEqual(checkOutput(r.reply), [], q);
    assert.doesNotMatch(r.reply, /\b(deja de|suspende|empieza a|inicia)\b/i, q);
    assert.doesNotMatch(r.reply, /\b\d+\s?(mg|ml|horas|dias|veces)\b/i, q);
    assert.match(r.reply, /m[ée]dico o farmac[ée]utico/, q);
    assert.match(r.reply, /no cambies ni suspendas/i, q);
  }
});
test('la IA nunca interviene en interacciones, ni en fase 2', async () => {
  let called = false;
  const env = { ASSISTANT_SCOPE: 'phase2', ASSISTANT_PROVIDER: 'anthropic', ANTHROPIC_API_KEY: 'x' };
  const realFetch = global.fetch;
  global.fetch = async () => { called = true; throw new Error('no debe llamarse'); };
  try {
    const { body } = await handleMessage({ message: '¿Puedo tomar ibuprofeno con warfarina?' }, env);
    assert.equal(body.provider, 'controlled');
    assert.equal(body.category, 'drug_interaction');
    assert.equal(called, false);
  } finally { global.fetch = realFetch; }
});
