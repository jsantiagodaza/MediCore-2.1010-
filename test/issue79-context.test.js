'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { controlledReply } = require('../server/assistant/engine');
const { findPlatformTopic, platformReply } = require('../server/assistant/platform-knowledge');

test('#79: reconoce variantes sobre Cuídate y responde con datos reales', () => {
  for (const q of ['¿Qué hace Cuídate?', '¿Para qué sirve Cuídate?', 'Cuéntame de Cuídate']) {
    const r = controlledReply(q);
    assert.equal(r.category, 'navigation');
    assert.match(r.reply, /IMC|masa corporal/i);
  }
});

test('#79: responde pasos concretos cuando preguntan cómo usar una herramienta', () => {
  const r = controlledReply('¿Dónde calculo mi IMC?');
  assert.equal(r.category, 'navigation');
  assert.match(r.reply, /Abre «Cuídate»/);
});

test('#79: seguimiento mediante historial explícito', () => {
  const history = [{ role: 'user', content: '¿Qué hace Cuídate?' }, {role: 'assistant',content: 'Cuídate incluye IMC y agua'}];
  const r = controlledReply('¿Y cómo lo uso?', undefined, history);
  assert.equal(r.category, 'navigation');
  assert.match(r.reply, /Cuídate/);
  assert.match(r.reply, /Abre «Cuídate»/);
});

test('#79: no inventa contexto si no existe historial', () => {
  assert.equal(findPlatformTopic('¿Y cómo lo uso?'), null);
});

test('#79: una nueva mención explícita prevalece sobre el historial', () => {
  const r = platformReply('¿Cómo uso el botiquín?', ['¿Qué hace Cuídate?']);
  assert.match(r.reply, /Botiquín/);
  assert.doesNotMatch(r.reply, /^Cuídate/);
});

test('#79: no confunde consulta general de salud con navegación', () => {
  assert.equal(findPlatformTopic('¿Para qué sirve la loratadina?'), null);
  assert.equal(findPlatformTopic('¿Qué lleva un botiquín básico?'), null);
  assert.equal(findPlatformTopic('¿Para qué sirven estos medicamentos?'), null);
});

test('#79: no reitera la presentación dentro de una conversación', () => {
  const r = controlledReply('Hola', undefined, ['¿Qué hace Cuídate?']);
  assert.equal(r.category, 'greeting');
  assert.doesNotMatch(r.reply, /Soy Mol/i);
});

test('#79: la prioridad de seguridad sigue antes del contexto', () => {
  const r = controlledReply('Me duele el pecho y me falta el aire', undefined, ['¿Qué hace Cuídate?']);
  assert.equal(r.category, 'emergency');
  assert.match(r.reply, /123/);
});
