// frontend/src/auth/session.js
// Guardado de la sesion en el navegador y aviso a los componentes cuando cambia.

const CLAVES = {
  token: 'medicore_token',
  usuario: 'medicore_user',
  expira: 'medicore_expira'
};

export const AUTH_EVENT = 'medicore:auth-changed';

function avisarCambio() {
  window.dispatchEvent(new Event(AUTH_EVENT));
}

/** Guarda el token y el usuario. */
export function saveSession({ token, expiresAt, user }) {
  localStorage.setItem(CLAVES.token, token);
  localStorage.setItem(CLAVES.usuario, JSON.stringify(user ?? null));
  if (expiresAt) {
    localStorage.setItem(CLAVES.expira, expiresAt);
  } else {
    localStorage.removeItem(CLAVES.expira);
  }
  avisarCambio();
}

/** Borra la sesion del navegador. */
export function clearSession() {
  Object.values(CLAVES).forEach((clave) => localStorage.removeItem(clave));
  avisarCambio();
}

/**
 * Devuelve { token, usuario } o null si no hay sesion (o ya caduco).
 * No modifica nada: es seguro llamarlo durante el render.
 */
export function getSession() {
  const token = localStorage.getItem(CLAVES.token);
  if (!token) {
    return null;
  }

  const expira = localStorage.getItem(CLAVES.expira);
  if (expira && new Date(expira).getTime() <= Date.now()) {
    return null;
  }

  let usuario;
  try {
    usuario = JSON.parse(localStorage.getItem(CLAVES.usuario) ?? 'null');
  } catch {
    usuario = null;
  }

  return { token, usuario };
}

/** Se ejecuta cada vez que se inicia o cierra sesion. Devuelve la funcion para desuscribirse. */
export function subscribeSession(callback) {
  window.addEventListener(AUTH_EVENT, callback);
  return () => window.removeEventListener(AUTH_EVENT, callback);
}
