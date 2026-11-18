'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { controlledReply } = require('../server/assistant/engine');
const { MODULES, findPlatformTopic } = require('../server/assistant/platform-knowledge');

test('Existe base estructurada para los cinco apartados', () => {
  assert.deepEqual(Object.keys(MODULES), ['cuida', 'medicamentos', 'sintomas', 'preparacion', 'botiquin']);
  Object.values(MODULES).forEach(m => {
    assert.ok(m.route && m.about && m.steps && m.limitations);
  });
});
for (const [question, token] of [
  ['¿Dónde calculo mi IMC?', 'Cuídate'],
  ['¿Cómo uso el buscador de medicamentos?', 'Medicamentos'],
  ['¿Cómo funciona la evaluación de síntomas?', 'Me siento mal'],
  ['¿Qué herramientas tiene Preparación?', 'Prepárate'],
  ['¿Cómo marco los elementos del botiquín?', 'Botiquín'],
  ['¿Qué módulos tiene MediCore?', 'Cuídate']
]) {
  test(`Mol guía: ${question}`, () => {
    const response = controlledReply(question);
    assert.equal(response.category, 'navigation');
    assert.match(response.reply, new RegExp(token, 'i'));
  });
}
test('No inventa alertas activas', () => {
  const response = controlledReply('¿Cómo funcionan las alertas por temporada?');
  assert.equal(response.category, 'navigation');
  assert.match(response.reply, /en desarrollo/);
});
test('No inventa gestión de medicamentos en Botiquín', () => {
  const response = controlledReply('¿Qué puedo hacer en Botiquín?');
  assert.match(response.reply, /no registra recetas/);
});
test('No interfiere con preguntas clínicas ni emergencias', () => {
  assert.equal(findPlatformTopic('¿Para qué sirve la loratadina?'), null);
  assert.equal(controlledReply('Tengo dolor de pecho, ¿dónde evalúo síntomas?').category, 'emergency');
});

test('Consultas informativas del botiquín conservan coming_soon en fase 1', () => {
  assert.equal(findPlatformTopic('¿Qué lleva un botiquín básico?'), null);
  assert.equal(controlledReply('¿Qué lleva un botiquín básico?').category, 'coming_soon');
});
test('Preguntar por medicamentos sin nombre conserva medication_not_found', () => {
  assert.equal(findPlatformTopic('¿Para qué sirven estos medicamentos?'), null);
  assert.equal(controlledReply('¿Para qué sirven estos medicamentos?').category, 'medication_not_found');
});
