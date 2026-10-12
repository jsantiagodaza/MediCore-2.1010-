'use strict';
const crypto = require('node:crypto');
const { controlledReply, DISCLAIMER } = require('./assistant/engine');
const { askModel, isEnabled } = require('./assistant/ai-provider');

const MAX_MESSAGE = 1000;
// Categorías cuya respuesta NUNCA se delega a la IA
const DETERMINISTIC = new Set(['emergency', 'self_harm', 'prompt_injection', 'diagnosis_refused', 'prescription_refused', 'medication_info', 'greeting', 'hydration', 'first_aid_kit']);

/** Lógica pura de POST /api/v1/assistant/messages. Devuelve { status, body }. */
async function handleMessage(payload, env = process.env) {
  if (!payload || typeof payload !== 'object' || typeof payload.message !== 'string') {
    return { status: 400, body: { error: 'invalid_request', detail: 'Se requiere { "message": string }.' } };
  }
  const message = payload.message.trim();
  if (!message) return { status: 400, body: { error: 'invalid_request', detail: 'El mensaje no puede estar vacío.' } };
  if (message.length > MAX_MESSAGE) return { status: 400, body: { error: 'message_too_long', detail: `Máximo ${MAX_MESSAGE} caracteres.` } };

  const result = controlledReply(message);
  let provider = 'controlled';
  if (!DETERMINISTIC.has(result.category) && isEnabled(env)) {
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
