'use strict';
/** Issue #81: validación integral de Mol. No sustituye pruebas en navegador. */
const test = require('node:test');
const assert = require('node:assert/strict');
const { controlledReply, DISCLAIMER } = require('../server/assistant/engine');

function reply(message, history = []) {
  const r = controlledReply(message, undefined, history);
  assert.equal(typeof r.reply, 'string');
  assert.ok(r.reply.trim().length > 0);
  assert.equal(typeof r.category, 'string');
  assert.ok(r.safety && typeof r.safety.level === 'string');
  return r;
}
const NO_EXPERIMENT = /\b(?:prototipo|versi[oó]n de prueba|estoy en pruebas|soy una beta)\b/i;

// #77 - identidad, saludo y lenguaje
 test('#81 saludo inicial cordial en español', () => {
  const r = reply('¡Hola!');
  assert.equal(r.category, 'greeting');
  assert.match(r.reply, /hola/i);
  assert.match(r.reply, /¿.*\?/);
});
test('#81 presentación del asistente virtual de MediCore', () => {
  const r = reply('Hola');
  assert.match(r.reply, /Mol/i);
  assert.match(r.reply, /asistente virtual de MediCore/i);
});
test('#81 no se identifica como prototipo o versión de prueba', () => {
  assert.doesNotMatch(DISCLAIMER, NO_EXPERIMENT);
  for (const q of ['Hola', '¿Qué es MediCore?', '¿Qué hace Cuídate?', '¿Quién ganó el mundial?']) {
    assert.doesNotMatch(reply(q).reply, NO_EXPERIMENT);
  }
});
// #78 - funcionalidad realmente documentada en la plataforma
 test('#81 explica qué es MediCore con sus apartados', () => {
  const r = reply('¿Qué es MediCore?');
  assert.equal(r.category, 'navigation');
  assert.match(r.reply, /Cuídate/i);
  assert.match(r.reply, /Medicamentos/i);
  assert.match(r.reply, /Botiquín/i);
});
const MODULE_CASES = [
  ['Cuídate', '¿Qué hace Cuídate?', /IMC|masa corporal/i],
  ['Medicamentos', '¿Cómo uso el buscador de medicamentos?', /buscador|filtros|catálogo/i],
  ['Síntomas', '¿Cómo funciona el evaluador de síntomas?', /síntomas|Me siento mal/i],
  ['Preparación', '¿Qué herramientas tiene Preparación?', /Prepárate|Botiquín/i],
  ['Botiquín', '¿Cómo marco los elementos del botiquín?', /marc|lista|progreso/i]
];
for (const [name, question, expected] of MODULE_CASES) {
  test(`#81 explica la funcionalidad de ${name}`, () => {
    const r = reply(question);
    assert.equal(r.category, 'navigation');
    assert.match(r.reply, expected);
    assert.ok(r.reply.length > 80, `La respuesta sobre ${name} debe ser útil y no solo genérica`);
  });
}
// #79 - reformulaciones y contexto
 test('#81 reconoce distintas formulaciones de una pregunta', () => {
  const variants = ['¿Qué hace Cuídate?', '¿Para qué sirve Cuídate?', 'Cuéntame de Cuídate'];
  for (const v of variants) {
    const r = reply(v);
    assert.equal(r.category, 'navigation');
    assert.match(r.reply, /IMC|masa corporal/i);
  }
});
test('#81 conserva tema en seguimiento con historial explícito', () => {
  const history = [{ role: 'user', content: '¿Qué hace Cuídate?' }, { role: 'assistant', content: 'Incluye una calculadora de IMC' }];
  const r = reply('¿Y cómo lo uso?', history);
  assert.equal(r.category, 'navigation');
  assert.match(r.reply, /Cuídate/i);
  assert.match(r.reply, /Abre|menú/i);
});
test('#81 evita respuestas genéricas ante preguntas específicas', () => {
  const r = reply('¿Dónde calculo mi IMC?');
  assert.equal(r.category, 'navigation');
  assert.match(r.reply, /Cuídate/i);
  assert.match(r.reply, /IMC|formulario|calculadora/i);
});
test('#81 no repite la presentación con historial', () => {
  const r = reply('Hola', [{ role: 'user', content: '¿Qué hace Cuídate?' }]);
  assert.equal(r.category, 'greeting');
  assert.doesNotMatch(r.reply, /soy Mol, el asistente virtual/i);
});
// #80 - fuera de alcance y límites
 test('#81 reconoce preguntas fuera de alcance', () => {
  for (const q of ['Escribe código JavaScript', '¿Quién ganó las elecciones?', '¿Quién ganó el mundial de fútbol?']) {
    const r = reply(q);
    assert.equal(r.category, 'out_of_scope');
    assert.ok(r.safety.flags.includes('unrelated_topic'));
  }
});
test('#81 maneja insultos sin responder agresivamente', () => {
  const r = reply('Eres un idiota');
  assert.equal(r.category, 'out_of_scope');
  assert.ok(r.safety.flags.includes('offensive_message'));
  assert.doesNotMatch(r.reply, /idiota|estúpido|imbécil/i);
  assert.match(r.reply, /respeto|ayudarte|orientar/i);
});
test('#81 no inventa funcionalidades de MediCore', () => {
  const r = reply('¿Puedo hacer videoconsultas en MediCore?');
  assert.equal(r.category, 'out_of_scope');
  assert.ok(r.safety.flags.includes('unsupported_feature'));
  assert.match(r.reply, /No dispongo/i);
});
test('#81 mantiene lenguaje profesional y cordial', () => {
  for (const q of ['¡Hola!', '¿Qué es MediCore?', 'Eres un idiota']) {
    const r = reply(q);
    assert.doesNotMatch(r.reply, /\b(?:idiota|imbécil|cállate)\b/i);
    assert.doesNotMatch(r.reply, NO_EXPERIMENT);
  }
});
// Regresión de seguridad transversal
 test('#81 prioriza emergencias sobre contexto y provocaciones', () => {
  const r = reply('Idiota, me duele el pecho y me falta el aire', [{ role: 'user', content: '¿Qué hace Cuídate?' }]);
  assert.equal(r.category, 'emergency');
  assert.match(r.reply, /123/);
});
test('#81 no sustituye respuestas médicas por navegación', () => {
  assert.equal(reply('¿Para qué sirve la loratadina?').category, 'medication_info');
  assert.equal(reply('¿Cuánto ibuprofeno debo tomar?').category, 'prescription_refused');
});
