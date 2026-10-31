'use strict';
/**
 * Genera docs/assistant-intents.md desde server/assistant/intents.js (única fuente de verdad).
 * Uso: npm run docs:intents          (escribe el archivo)
 *      node scripts/gen-intents-doc.js --check   (falla si el .md está desactualizado)
 */
const fs = require('node:fs');
const path = require('node:path');
const { INTENTS, byKind } = require('../server/assistant/intents');

const OUT = path.join(__dirname, '..', 'docs', 'assistant-intents.md');
const esc = (s) => String(s).replace(/\|/g, '\\|');

function detail(i) {
  const ex = i.examples.map((e) => `  - «${e.q}» → \`${e.expect}\``).join('\n');
  return `#### \`${i.id}\` — ${i.title}\n\n- **Qué es:** ${i.description}\n- **Qué hace Mol:** ${i.behavior}\n- **Categoría de API:** \`${i.category}\`\n- **Fuente de datos:** ${i.source}\n- **Ejemplos (resultado en fase 1):**\n${ex}\n`;
}

function render() {
  const supported = byKind('supported');
  const safety = byKind('safety');
  const planned = byKind('planned');
  const oos = byKind('out_of_scope');

  const summary = (list) => list.map((i) => `| \`${i.id}\` | ${esc(i.title)} | \`${i.category}\` |`).join('\n');

  return `<!-- ARCHIVO GENERADO por scripts/gen-intents-doc.js desde server/assistant/intents.js. NO editar a mano: edita el catálogo y ejecuta \`npm run docs:intents\`. -->
# Mol — Intenciones y alcance del asistente

Issue #29 · Estado: **definición del alcance de la fase 1** · Relacionado: [\`ai-safety.md\`](ai-safety.md)

## 1. Alcance acordado

> *"La intención es que MOL trabaje con los medicamentos existentes del catálogo. Es decir, que puedas preguntarle por alguna medicina que esté en la BD y él te dé su información, contraindicaciones y demás. Nada más de eso inicialmente."* — dueño del proyecto, comentario en el issue #29

Por eso la **fase 1** (activa por defecto) cubre únicamente:

1. **Consultar medicamentos del catálogo** (\`MED_INFO\`, \`MED_NOT_FOUND\`) + un saludo de cortesía.
2. **Protecciones de seguridad** que siempre están activas (emergencias, autolesión, manipulación, diagnóstico, dosis/receta).

El issue también nombra *navegación, uso de MediCore, orientación general e hidratación*. Esas intenciones quedan **definidas pero inactivas (fase 2)**: así el catálogo está completo sin ampliar el alcance de lo pedido. Se activan con \`ASSISTANT_SCOPE=phase2\` cuando el equipo lo decida.

## 2. Resumen

### Soportadas hoy (fase 1)
| ID | Intención | Categoría de API |
|---|---|---|
${summary(supported)}

### Seguridad — siempre activas, Mol NO ayuda con esto y protege
| ID | Intención | Categoría de API |
|---|---|---|
${summary(safety)}

### Planificadas (fase 2, inactivas)
| ID | Intención | Categoría de API |
|---|---|---|
${summary(planned)}

### Fuera de alcance (Mol las declina)
| ID | Intención | Categoría de API |
|---|---|---|
${summary(oos)}

## 3. Orden de decisión

Cada mensaje se evalúa **en este orden** y se detiene en la primera coincidencia:

1. **Seguridad**, en este orden: emergencia → autolesión → manipulación → pedido de diagnóstico → pedido de dosis/receta
2. ¿Menciona un medicamento del catálogo? Si pregunta por precio/compra/marca: fuera de alcance; si no: \`MED_INFO\`
3. Saludo o tema planificado (hidratación, botiquín): en fase 1 responde "próximamente"
4. ¿Parece una pregunta sobre un medicamento que no encontró? → \`MED_NOT_FOUND\`
5. Cualquier otra cosa → fuera de alcance (mensaje estándar)

La seguridad va **antes** que todo: «¿Cuánto ibuprofeno tomo? Me duele el pecho» es una emergencia, no una consulta de medicamento.

## 4. Detalle de intenciones

### 4.1 Soportadas (fase 1)

${supported.map(detail).join('\n')}
### 4.2 Seguridad (siempre activas)

${safety.map(detail).join('\n')}
### 4.3 Planificadas (fase 2)

${planned.map(detail).join('\n')}
### 4.4 Fuera de alcance

${oos.map(detail).join('\n')}
## 5. Qué datos usa Mol (y qué NO tiene)

| Dato | Base de datos (\`medicines\`, issue #4) | Catálogo del prototipo (\`js/data.js\`) |
|---|---|---|
| Nombre | ✅ \`name\` | ✅ |
| Principio activo | ✅ \`active_ingredient\` | ❌ |
| Concentración / presentación | ✅ \`strength\`, \`pharmaceutical_form\` | parcial (\`dose\`) |
| Para qué sirve / cuándo se usa | ❌ **no existe** | ✅ \`uso\`, \`cuando\` |
| Precauciones y contraindicaciones | ❌ **no existe** | ✅ \`prec\` (mezcla ambas, sin clasificar) |
| Dosis | ❌ | ✅ \`dosis\` — **Mol nunca la muestra** |

**Consecuencia:** el dueño pidió información y contraindicaciones "de la BD", pero la tabla actual solo guarda 4 datos del medicamento. Hoy Mol obtiene el resto del catálogo del prototipo, que **no tiene revisión clínica**. Ver decisión D1.

**Cobertura de la BD:** los 11 nombres del seed (Acetaminofén, Amoxicilina, Atorvastatina, Diclofenaco, Dolex, Ibuprofeno, Loratadina, Losartán, Metformina, Omeprazol, Salbutamol) tienen respuesta. *Dolex* se resuelve por su principio activo (Acetaminofén); es un alias en el prototipo, y con la BD como fuente se resolvería buscando por \`active_ingredient\`.

## 6. Decisiones abiertas (requieren respuesta del equipo)

| # | Decisión | Quién | Propuesta |
|---|---|---|---|
| D1 | La BD no tiene usos ni contraindicaciones | Dueño + BD (José) | Ampliar el esquema (p. ej. \`indications\`, \`contraindications\`, \`precautions\`) y cargarlo con **revisión clínica**. Mientras, mantener el catálogo del prototipo con el aviso visible. |
| D2 | ¿Mostrar las presentaciones de la BD (concentración + forma, ej. "500 mg, tableta")? | Dueño | Es información del producto, no posología. Se podría añadir a \`MED_INFO\` cuando la BD sea la fuente. Dosis y horarios siguen excluidos. |
| D3 | El modelo Java \`Medicine\` (\`name, description, category\`) no coincide con la tabla SQL (\`name, active_ingredient, strength, pharmaceutical_form\`) | Backend (Jainer) + BD (José) | Alinear antes de conectar el asistente. |
| D4 | El endpoint del asistente hoy es Node (prototipo); el backend real es Spring | Backend (Jainer) | Reimplementar \`POST /api/v1/assistant/messages\` en Spring con este catálogo y contrato. |
| D5 | El frontend principal migró a React; la pantalla de Mol vive en el \`index.html\` antiguo | Frontend | Portar a una página React. |

## 7. Cómo se verifica

- \`test/intents.test.js\` ejecuta **cada ejemplo** de este documento contra el asistente y exige la categoría indicada.
- También comprueba que este archivo coincide con el catálogo (\`node scripts/gen-intents-doc.js --check\`).
- Ejecutar todo: \`npm test\`.
`;
}

if (require.main === module) {
  const md = render();
  if (process.argv.includes('--check')) {
    const current = fs.existsSync(OUT) ? fs.readFileSync(OUT, 'utf8') : '';
    if (current !== md) { console.error('docs/assistant-intents.md está desactualizado. Ejecuta: npm run docs:intents'); process.exit(1); }
    console.log('docs/assistant-intents.md está al día.');
  } else {
    fs.writeFileSync(OUT, md);
    console.log('Generado', path.relative(process.cwd(), OUT));
  }
}
module.exports = { render, OUT };
