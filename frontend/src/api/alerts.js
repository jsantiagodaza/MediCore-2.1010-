// frontend/src/api/alerts.js
import { requestJson } from './client';

export function fetchAlerts({ signal } = {}) {
  // Tu compañero expuso el endpoint GET /api/v1/alerts
  return requestJson('/api/v1/alerts', { signal });
}