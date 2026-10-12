'use strict';
/**
 * Carga el catálogo existente del frontend (js/data.js) sin duplicarlo.
 * OJO: es un catálogo interno del MVP 2025, NO revisado clínicamente (ver docs/ai-safety.md).
 */
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { normalize } = require('./safety');

function loadCatalog() {
  const file = path.join(__dirname, '..', '..', 'js', 'data.js');
  const code = fs.readFileSync(file, 'utf8') + '\n;({ MEDS, SYMPTOMS });';
  const { MEDS, SYMPTOMS } = vm.runInNewContext(code, {}, { timeout: 1000 });
  // El catálogo tiene entradas repetidas: se conserva la primera (igual que app.js)
  const unique = [...new Map(MEDS.map((m) => [m.n, m])).values()];
  return { meds: unique, symptoms: SYMPTOMS };
}

const ALIASES = { paracetamol: 'acetaminofen', 'vitamina d': 'vitamina d3', sro: 'suero oral (sro)', 'suero oral': 'suero oral (sro)' };

function findMedication(message, meds) {
  const text = normalize(message);
  // Nombre más largo primero para que "Cafeína + Acetaminofén" gane a "Acetaminofén"
  const sorted = [...meds].sort((a, b) => b.n.length - a.n.length);
  const byName = sorted.find((m) => text.includes(normalize(m.n).replace(/ crema$/, '')));
  if (byName) return byName;
  for (const [alias, target] of Object.entries(ALIASES)) {
    if (text.includes(alias)) {
      const hit = meds.find((m) => normalize(m.n) === target);
      if (hit) return hit;
    }
  }
  return null;
}

function findSymptoms(message, symptoms) {
  const text = normalize(message);
  return symptoms.filter((s) => text.includes(normalize(s.n).split(' /')[0]));
}

const isPrescriptionOnly = (m) => m.prec.some((p) => /PRESCRIP|RECETA/i.test(p)) || /SOLO CON PRESCRIPCI|bajo prescripci/i.test(m.cuando);

const SOURCES = {
  catalog: { name: 'Catálogo interno MediCore (MVP 2025, sin revisión clínica)', url: null },
  medline: { name: 'MedlinePlus en español – Medicamentos', url: 'https://medlineplus.gov/spanish/druginformation.html' },
  invima: { name: 'INVIMA – Consulta de registros sanitarios', url: 'https://www.invima.gov.co/' },
  minsalud: { name: 'Ministerio de Salud de Colombia', url: 'https://www.minsalud.gov.co/' },
  oms: { name: 'OMS – Medicamentos esenciales', url: 'https://www.who.int/health-topics/essential-medicines' }
};

module.exports = { loadCatalog, findMedication, findSymptoms, isPrescriptionOnly, SOURCES };
