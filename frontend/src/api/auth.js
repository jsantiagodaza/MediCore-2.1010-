// frontend/src/api/auth.js
// Llamadas a los endpoints de autenticacion del backend.

import { requestJson } from './client';

/** POST /api/v1/auth/login -> { token, expiresAt, user } */
export function login(email, password) {
  return requestJson('/api/v1/auth/login', {
    method: 'POST',
    body: { email, password }
  });
}

/** POST /api/v1/auth/register -> { id, email, name } */
export function register({ email, password, name }) {
  return requestJson('/api/v1/auth/register', {
    method: 'POST',
    body: { email, password, name }
  });
}

/** GET /api/v1/auth/me -> { id, email, name } */
export function fetchMe(token) {
  return requestJson('/api/v1/auth/me', { token });
}

/** POST /api/v1/auth/logout (204) */
export function logout(token) {
  return requestJson('/api/v1/auth/logout', { method: 'POST', token });
}
