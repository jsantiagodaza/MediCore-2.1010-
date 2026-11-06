'use strict';
const crypto = require('node:crypto');
const { controlledReply, DISCLAIMER } = require('./assistant/engine');
const { askModel, isEnabled } = require('./assistant/ai-provider');
const { scopeFromEnv, SCOPE } = require('./assistant/intents');

const MAX_MESSAGE = 1000;

/** Lógica pura de POST /api/v1/assistant/messages. Devuelve { status, body }. */
async function handleMessage(payload, env = process.env) {
  if (!payload || typeof payload !== 'object' || typeof payload.message !== 'string') {
    return { status: 400, body: { error: 'invalid_request', detail: 'Se requiere { "message": string }.' } };
  }
  const message = payload.message.trim();
  if (!message) return { status: 400, body: { error: 'invalid_request', detail: 'El mensaje no puede estar vacío.' } };
  if (message.length > MAX_MESSAGE) return { status: 400, body: { error: 'message_too_long', detail: `Máximo ${MAX_MESSAGE} caracteres.` } };

  const scope = scopeFromEnv(env);
  const result = controlledReply(message, scope);
  let provider = 'controlled';
  // La IA solo puede intervenir en fase 2 y únicamente en preguntas fuera de las intenciones definidas.
  // Seguridad, medicamentos y respuestas fijas son SIEMPRE deterministas.
  if (scope >= SCOPE.PHASE2 && result.category === 'out_of_scope' && !result.safety.flags.length && isEnabled(env)) {
    const ai = await askModel(message, env);
    if (ai) { result.reply = ai; provider = 'anthropic'; }
  }

  return {
    status: 200,
    body: {
      id: 'msg_' + crypto.randomBytes(6).toString('hex'),
      mode: 'prototype',
      provider,
      category: result.category,
      safety: result.safety,
      reply: result.reply,
      sources: result.sources,
      suggested_actions: result.suggested_actions,
      disclaimer: DISCLAIMER
    }
  };
}

module.exports = { handleMessage, MAX_MESSAGE };
