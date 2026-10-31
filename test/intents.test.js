'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { INTENTS, SCOPE, isActive, scopeFromEnv, byKind } = require('../server/assistant/intents');
const { controlledReply, catalog } = require('../server/assistant/engine');
const { handleMessage } = require('../server/handler');
const { render, OUT } = require('../scripts/gen-intents-doc');

// ---- Integridad del catálogo ----
test('ids únicos y campos obligatorios', () => {
  const ids = INTENTS.map((i) => i.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const i of INTENTS) {
    for (const k of ['id', 'kind', 'title', 'description', 'behavior', 'category', 'source']) assert.ok(i[k], `${i.id}.${k}`);
    assert.ok(['supported', 'safety', 'planned', 'out_of_scope'].includes(i.kind), i.id);
    assert.ok(i.examples.length >= 1, `${i.id} sin ejemplos`);
  }
});

test('cada tipo de intención tiene al menos una', () => {
  for (const k of ['supported', 'safety', 'planned', 'out_of_scope']) assert.ok(byKind(k).length > 0, k);
});

// ---- Cada ejemplo documentado se comporta como se documenta (fase 1) ----
for (const intent of INTENTS) {
  for (const { q, expect } of intent.examples) {
    test(`[${intent.id}] «${q}» -> ${expect}`, () => assert.equal(controlledReply(q, SCOPE.PHASE1).category, expect));
  }
}

// ---- Alcance por fases ----
test('fase 1 por defecto; phase2 solo con ASSISTANT_SCOPE=phase2', () => {
  assert.equal(scopeFromEnv({}), SCOPE.PHASE1);
  assert.equal(scopeFromEnv({ ASSISTANT_SCOPE: 'otra-cosa' }), SCOPE.PHASE1);
  assert.equal(scopeFromEnv({ ASSISTANT_SCOPE: 'phase2' }), SCOPE.PHASE2);
});

test('isActive: supported/safety siempre; planned solo en fase 2; desconocida nunca', () => {
  assert.equal(isActive('MED_INFO', SCOPE.PHASE1), true);
  assert.equal(isActive('EMERGENCY', SCOPE.PHASE1), true);
  assert.equal(isActive('HYDRATION', SCOPE.PHASE1), false);
  assert.equal(isActive('HYDRATION', SCOPE.PHASE2), true);
  assert.equal(isActive('NO_EXISTE', SCOPE.PHASE2), false);
});

test('fase 2 activa hidratación y botiquín; fase 1 los deja como "próximamente"', () => {
  assert.equal(controlledReply('¿Cuánta agua debería tomar?', SCOPE.PHASE1).category, 'coming_soon');
  assert.equal(controlledReply('¿Cuánta agua debería tomar?', SCOPE.PHASE2).category, 'hydration');
  assert.equal(controlledReply('¿Qué lleva un botiquín básico?', SCOPE.PHASE1).category, 'coming_soon');
  assert.equal(controlledReply('¿Qué lleva un botiquín básico?', SCOPE.PHASE2).category, 'first_aid_kit');
});

test('la seguridad tiene prioridad aun en fase 2', () => {
  assert.equal(controlledReply('Me duele el pecho, ¿cuánto ibuprofeno tomo?', SCOPE.PHASE2).category, 'emergency');
});

// ---- Reglas de intención ----
test('consulta comercial con nombre de medicamento NO devuelve la ficha', () => {
  const r = controlledReply('¿Cuánto cuesta el ibuprofeno?');
  assert.equal(r.category, 'out_of_scope');
  assert.doesNotMatch(r.reply, /Antiinflamatorio/);
});

test('MED_NOT_FOUND no inventa información y sugiere nombres reales del catálogo', () => {
  const r = controlledReply('¿Para qué sirve el sildenafil?');
  assert.match(r.reply, /No encontré/);
  assert.match(r.reply, /Ibuprofeno/);
});

test('MED_INFO nunca contiene cifras (dosis/duración) en ninguno de los medicamentos del catálogo', () => {
  for (const m of catalog.meds) {
    const r = controlledReply(`para que sirve ${m.n}`);
    if (r.category !== 'medication_info') continue;
    // Se ignoran cifras que forman parte del nombre (D3, Omega-3) o del uso descriptivo; se exige que no haya "mg/g/ml" ni "cada N horas"
    const body = r.reply.replace(m.n, '');
    assert.doesNotMatch(body, /\b\d+([.,]\d+)?\s?(mg|mcg|g|ml|ui)\b/i, m.n);
    assert.doesNotMatch(body, /cada \d+ horas/i, m.n);
  }
});

// Nombres del seed de la BD (issue #4, rama feature/database-schema)
const DB_SEED = ['Acetaminofén', 'Amoxicilina', 'Atorvastatina', 'Diclofenaco', 'Dolex', 'Ibuprofeno', 'Loratadina', 'Losartán', 'Metformina', 'Omeprazol', 'Salbutamol'];
for (const name of DB_SEED) {
  test(`cobertura BD: «${name}» tiene respuesta de catálogo`, () => {
    assert.equal(controlledReply(`¿Para qué sirve ${name}?`).category, 'medication_info');
  });
}

// ---- La IA solo en fase 2 y solo en out_of_scope sin banderas ----
const ENV_AI = { ASSISTANT_PROVIDER: 'anthropic', ANTHROPIC_API_KEY: 'k' };
test('fase 1: la IA no interviene aunque esté configurada', async () => {
  const { body } = await handleMessage({ message: '¿Quién ganó el mundial?' }, ENV_AI);
  assert.equal(body.provider, 'controlled');
});

// ---- Documento generado ----
test('docs/assistant-intents.md está al día con el catálogo', () => {
  assert.equal(fs.readFileSync(OUT, 'utf8'), render());
});
test('el documento menciona todos los ids de intención', () => {
  const md = fs.readFileSync(OUT, 'utf8');
  for (const i of INTENTS) assert.ok(md.includes('`' + i.id + '`'), i.id);
});
