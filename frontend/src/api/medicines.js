// frontend/src/api/medicines.js
// Cliente HTTP del catálogo de medicamentos (backend Spring Boot).

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8080';

async function request(path, signal) {
  const respuesta = await fetch(`${BASE_URL}${path}`, { signal });
  if (!respuesta.ok) {
    throw new Error(`El backend respondió ${respuesta.status} en ${path}`);
  }
  return respuesta.json();
}

/**
 * GET /api/v1/medicines?search=&category=
 * @returns {Promise<Array<{
 *   id:number, name:string, category:string, categoryClass:string, dose:string,
 *   uses:string, posology:string, whenToTake:string, precautions:string[],
 *   molTip:string, emoji:string
 * }>>}
 */
export function fetchMedicines({ search, category, signal } = {}) {
  const params = new URLSearchParams();
  if (search && search.trim()) {
    params.set('search', search.trim());
  }
  if (category && category !== 'all') {
    params.set('category', category);
  }
  const query = params.toString();
  return request(`/api/v1/medicines${query ? `?${query}` : ''}`, signal);
}

/** GET /api/v1/medicines/categories -> ["Analgésico", "Antibiótico", ...] */
export function fetchCategories(signal) {
  return request('/api/v1/medicines/categories', signal);
}
