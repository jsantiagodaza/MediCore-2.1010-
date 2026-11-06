// frontend/src/api/client.js
// Punto unico de acceso al backend: URL base, cabeceras y manejo de errores.

export const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8080';

/** Error con el mensaje que devolvio el backend (o uno generico). */
export class ApiError extends Error {
  constructor(status, mensaje) {
    super(mensaje);
    this.name = 'ApiError';
    this.status = status;
  }
}

/**
 * Hace una peticion JSON al backend.
 *
 * @param {string} path              ruta relativa, ej. '/api/v1/auth/login'
 * @param {object} [options]
 * @param {string} [options.method]  verbo HTTP (por defecto GET)
 * @param {object} [options.body]    cuerpo que se enviara como JSON
 * @param {string} [options.token]   token de sesion (se envia como Bearer)
 * @param {AbortSignal} [options.signal]
 */
export async function requestJson(path, { method = 'GET', body, token, signal } = {}) {
  const headers = { Accept: 'application/json' };
  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let respuesta;
  try {
    respuesta = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      signal,
      body: body === undefined ? undefined : JSON.stringify(body)
    });
  } catch (e) {
    if (e.name === 'AbortError') throw e;
    throw new ApiError(0, 'No se pudo conectar con el servidor. ¿Está corriendo el backend?');
  }

  if (respuesta.status === 204) {
    return null;
  }

  const texto = await respuesta.text();
  let datos = null;
  if (texto) {
    try {
      datos = JSON.parse(texto);
    } catch {
      datos = null;
    }
  }

  if (!respuesta.ok) {
    const mensaje = datos?.mensaje ?? datos?.error ?? `El servidor respondió ${respuesta.status}`;
    throw new ApiError(respuesta.status, mensaje);
  }

  return datos;
}
