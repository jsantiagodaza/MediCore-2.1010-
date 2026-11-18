'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { controlledReply, DISCLAIMER } = require('../server/assistant/engine');

const experimental = /\b(prototipo|versi[oó]n de prueba|en pruebas|beta|en desarrollo)\b/i;

test('#77: Mol se presenta como asistente virtual oficial en español', () => {
  const response = controlledReply('¡Hola!');
  assert.equal(response.category, 'greeting');
  assert.match(response.reply, /soy Mol, el asistente virtual de MediCore/i);
  assert.match(response.reply, /¿Qué te gustaría consultar hoy\?/);
  assert.doesNotMatch(response.reply, experimental);
});

test('#77: saludos habituales sin promesas médicas', () => {
  for (const message of ['Hola', 'Buenas tardes', 'Buenos días', '¿Cómo te llamas?']) {
    const response = controlledReply(message);
    assert.equal(response.category, 'greeting');
    assert.match(response.reply, /MediCore/);
    assert.doesNotMatch(response.reply, experimental);
  }
});

test('#77: aviso clínico, ficha y respuesta de respaldo no declaran un prototipo', () => {
  assert.doesNotMatch(DISCLAIMER, experimental);
  assert.match(DISCLAIMER, /no establece diagnósticos|no sustituye/i);
  for (const message of ['¿Para qué sirve la loratadina?', '¿Quién ganó el mundial?', '¿Cuánta agua debería tomar?']) {
    const response = controlledReply(message);
    assert.doesNotMatch(response.reply, experimental);
  }
});

test('#77: preguntas con saludo priorizan el contenido, no una bienvenida genérica', () => {
  const response = controlledReply('Hola, ¿para qué sirve el ibuprofeno?');
  assert.equal(response.category, 'medication_info');
});

test('#77: la seguridad sigue siendo prioritaria ante una emergencia', () => {
  const response = controlledReply('Hola, me duele el pecho y me falta el aire');
  assert.equal(response.category, 'emergency');
  assert.match(response.reply, /123/);
});
