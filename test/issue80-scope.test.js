'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { scopeReply } = require('../server/assistant/scope-filters');
const { controlledReply } = require('../server/assistant/engine');

test('#80: insultos se responden con calma, sin hostilidad', () => {
  for (const q of ['Eres un idiota', 'Este bot es una basura', 'Cállate, inútil']) {
    const r = controlledReply(q);
    assert.equal(r.category, 'out_of_scope');
    assert.deepEqual(r.safety.flags, ['offensive_message']);
    assert.doesNotMatch(r.reply, /eres un idiota|callate/i);
  }
});
test('#80: programación, política y entretenimiento fuera de alcance', () => {
  for (const q of ['Escribe código JavaScript', '¿Quién ganó las elecciones?', '¿Quién ganó el mundial de fútbol?']) {
    const r = controlledReply(q);
    assert.equal(r.category, 'out_of_scope');
    assert.deepEqual(r.safety.flags, ['unrelated_topic']);
  }
});
test('#80: no inventa funciones inexistentes', () => {
  for (const q of ['¿Puedo agendar citas médicas en MediCore?', '¿Tiene MediCore videollamadas?', '¿Cómo sincronizo el botiquín entre dispositivos?']) {
    const r = controlledReply(q);
    assert.equal(r.category, 'out_of_scope');
    assert.deepEqual(r.safety.flags, ['unsupported_feature']);
    assert.match(r.reply, /No dispongo/);
  }
});
test('#80: no inventa datos de cuentas o historiales', () => {
  const r = controlledReply('¿Puedes mostrar mis datos personales?');
  assert.equal(r.category, 'out_of_scope');
  assert.deepEqual(r.safety.flags, ['unavailable_personal_data']);
});
test('#80: mantiene consultas válidas sobre MediCore', () => {
  assert.equal(controlledReply('¿Qué hace Cuídate?').category, 'navigation');
  assert.equal(controlledReply('¿Dónde calculo mi IMC?').category, 'navigation');
});
test('#80: protege casos clínicos aun con lenguaje desagradable', () => {
  const r = controlledReply('Idiota, me duele el pecho y me falta el aire');
  assert.equal(r.category, 'emergency');
});
test('#80: no intercepta consultas clínicas ni medicamentos', () => {
  for (const q of ['¿Para qué sirve la loratadina?', '¿Cuánto ibuprofeno debo tomar?']) {
    assert.equal(scopeReply(q), null);
  }
});
test('#80: una función no disponible no se presenta como disponible', () => {
  const r = controlledReply('¿Puedo hacer videoconsultas en MediCore?');
  assert.equal(r.category, 'out_of_scope');
  assert.doesNotMatch(r.reply, /puedes realizar videollamadas/i);
});
