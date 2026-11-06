'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { INTENTS, EXTRA_CASES, SCOPE, isActive, scopeFromEnv, byKind, backendFor } = require('../server/assistant/intents');
const { controlledReply, catalog } = require('../server/assistant/engine');
const { handleMessage } = require('../server/handler');
const { render, renderCases, OUT, OUT_JSON } = require('../scripts/gen-intents-doc');

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

// ---- Variantes adicionales (casos que hoy fallan en el backend) ----
for (const c of EXTRA_CASES) {
  test(`[${c.intent}] variante «${c.q}» -> ${c.expect}`, () => assert.equal(controlledReply(c.q, SCOPE.PHASE1).category, c.expect));
}

// ---- Mapa hacia el backend ----
test('cada intención declara su mapa hacia el backend', () => {
  for (const i of INTENTS) {
    assert.ok(['ok', 'gap', 'unsafe'].includes(i.backend.status), i.id);
    assert.ok(Array.isArray(i.backend.expected) && i.backend.expected.length > 0, i.id);
    assert.ok(i.backend.today && i.backend.note, i.id);
  }
});
test('los estados son por mensaje: un ejemplo que sí funciona en el backend no se marca como inseguro', () => {
  assert.equal(backendFor('EMERGENCY', 'Tengo dolor de pecho y me falta el aire').status, 'ok');
  assert.equal(backendFor('EMERGENCY', 'Me duele el pecho').status, 'unsafe');
});
test('las intenciones de emergencia y autolesión exigen emergencia=true en el backend', () => {
  assert.equal(INTENTS.find((i) => i.id === 'EMERGENCY').backend.emergencia, true);
  assert.equal(INTENTS.find((i) => i.id === 'SELF_HARM').backend.emergencia, true);
});
test('las fichas de medicamento y las peticiones de dosis prohíben "Dosis habitual" en el backend', () => {
  for (const id of ['MED_INFO', 'DOSAGE_OR_PRESCRIPTION', 'OOS_COMMERCIAL']) assert.deepEqual(INTENTS.find((i) => i.id === id).backend.forbid, ['Dosis habitual']);
});

// ---- Casos de aceptación para el backend (JSON) ----
test('casos de aceptación: uno por ejemplo y por variante, con ids únicos', () => {
  const { cases } = JSON.parse(renderCases());
  const total = INTENTS.reduce((n, i) => n + i.examples.length, 0) + EXTRA_CASES.length;
  assert.equal(cases.length, total);
  assert.equal(new Set(cases.map((c) => c.id)).size, cases.length);
  for (const c of cases) {
    assert.ok(c.query && c.intent && c.expectedBackendIntent.length > 0, c.id);
    assert.ok(['ok', 'gap', 'unsafe'].includes(c.statusToday), c.id);
  }
});
test('docs/assistant-acceptance-cases.json está al día con el catálogo', () => {
  assert.equal(fs.readFileSync(OUT_JSON, 'utf8'), renderCases());
});

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
