'use strict';
/**
 * Genera docs/assistant-intents.md desde server/assistant/intents.js (única fuente de verdad).
 * Uso: npm run docs:intents          (escribe el archivo)
 *      node scripts/gen-intents-doc.js --check   (falla si el .md está desactualizado)
 */
const fs = require('node:fs');
const path = require('node:path');
const { INTENTS, EXTRA_CASES, BACKEND_REF, backendFor, byKind } = require('../server/assistant/intents');

const OUT = path.join(__dirname, '..', 'docs', 'assistant-intents.md');
const OUT_JSON = path.join(__dirname, '..', 'docs', 'assistant-acceptance-cases.json');
const LABEL = { ok: '✅ cumple', gap: '⚠️ brecha', unsafe: '🚨 inseguro' };
const esc = (s) => String(s).replace(/\|/g, '\\|');

function detail(i) {
  const ex = i.examples.map((e) => `  - «${e.q}» → \`${e.expect}\``).join('\n');
  return `#### \`${i.id}\` — ${i.title}\n\n- **Qué es:** ${i.description}\n- **Qué hace Mol:** ${i.behavior}\n- **Categoría de API (prototipo Node):** \`${i.category}\`\n- **Backend Spring hoy → esperado:** \`${i.backend.today}\` → ${i.backend.expected.map((e) => '`' + e + '`').join(' o ')}${i.backend.proposedNew ? ' *(valor nuevo propuesto)*' : ''} · ${LABEL[i.backend.status]}\n- **Fuente de datos:** ${i.source}\n- **Ejemplos (resultado en fase 1):**\n${ex}\n`;
}

function backendCounts() {
  const all = [
    ...INTENTS.flatMap((i) => i.examples.map((e) => backendFor(i.id, e.q))),
    ...EXTRA_CASES.map((c) => c.backend)
  ];
  const n = (st) => all.filter((c) => c.status === st).length;
  return { total: all.length, ok: n('ok'), gap: n('gap'), unsafe: n('unsafe') };
}

function render() {
  const bc = backendCounts();
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
## 5. Qué datos usa Mol

Hoy conviven **tres fuentes** con el mismo medicamento y datos distintos:

| Dato | Backend: tabla \`medicine\` (Flyway V1/V2, 131 medicamentos) | \`database/\`: tabla \`medicines\` (6 de demostración) | Catálogo antiguo \`js/data.js\` |
|---|---|---|---|
| Nombre | ✅ \`name\` | ✅ \`name\` | ✅ |
| Principio activo | ❌ | ✅ \`active_ingredient\` | ❌ |
| Presentación | ✅ \`dose\` (ej. "500 mg") | ✅ \`strength\` + \`pharmaceutical_form\` | parcial |
| Categoría | ✅ \`category\` | ❌ | ✅ |
| Para qué sirve | ✅ \`uses\` | ❌ (solo \`description\` "demo") | ✅ |
| Cuándo tomarlo | ✅ \`when_to_take\` | ❌ | ✅ |
| Precauciones y contraindicaciones | ✅ tabla \`medicine_precaution\` | ❌ | ✅ (mezcla ambas, sin clasificar) |
| Dosis habitual | ✅ \`posology\` | ❌ | ✅ — **Mol no debería mostrarla** (ver D2) |

**Qué lee el asistente:** el \`AssistantService\` del backend consulta la tabla \`medicine\` de Flyway (131 medicamentos, todos con \`posology\`). La tabla \`medicines\` de \`database/\` **no la lee nadie todavía**.

**Sobre la revisión clínica:** los usos, precauciones y dosis existen en \`medicine\`, pero se migraron tal cual desde el catálogo del frontend, sin que un profesional de la salud los haya revisado (ver D1).

## 6. Mapa hacia el backend real (\`AssistantService.java\`)

El contrato vigente es el del backend (\`POST /api/v1/assistant/messages\`, ruta **privada** con token, mensaje de hasta 500 caracteres). Respuesta: \`id, respuesta, intent, confianza, emergencia, sugerencias, fuentes, datos, timestamp\`. Intenciones actuales: \`SALUDO, MEDICAMENTO, SINTOMAS, EMERGENCIA, FUERA_DE_ALCANCE, NO_ENTENDIDO\`.

El prototipo Node (\`server/\`) es la **referencia de comportamiento**: define cómo debe responder Mol; no es el backend de producción.

> **Cómo se obtuvo esta tabla:** análisis por lectura de \`AssistantService.java\` en \`${BACKEND_REF}\`. **No se ejecutó Java** (no había Maven en el entorno de análisis): se reprodujo su lógica de coincidencia de texto y se contrastó con cada ejemplo. Para comprobarlo con el código real, use \`docs/assistant-acceptance-cases.json\` como casos de prueba (ver sección 8).

**Resultado:** de **${bc.total} mensajes** de prueba, ${bc.ok} se comportan como se espera (✅), ${bc.gap} tienen una brecha (⚠️) y ${bc.unsafe} son inseguros (🚨).

### 6.1 Por intención

| ID | Backend hoy | Esperado | Estado | Observación |
|---|---|---|---|---|
${INTENTS.map((i) => `| \`${i.id}\` | \`${i.backend.today}\` | ${i.backend.expected.map((e) => '`' + e + '`').join(' o ')}${i.backend.proposedNew ? ' *(nuevo)*' : ''} | ${LABEL[i.backend.status]} | ${esc(i.backend.note)} |`).join('\n')}

### 6.2 Variantes que hoy fallan

| Mensaje | Intención | Backend hoy | Esperado | Estado | Observación |
|---|---|---|---|---|---|
${EXTRA_CASES.map((c) => `| «${esc(c.q)}» | \`${c.intent}\` | \`${c.backend.today}\` | ${c.backend.expected.map((e) => '`' + e + '`').join(' o ')} | ${LABEL[c.backend.status]} | ${esc(c.backend.note)} |`).join('\n')}

### 6.3 Hallazgos por prioridad

1. 🚨 **Autolesión sin respuesta.** Solo "suicid" se detecta. "Quiero quitarme la vida", "No quiero vivir más" o "Quiero morirme" reciben "no entendí", sin indicar el 123 ni apoyo. Es el hallazgo más grave.
2. 🚨 **Emergencias con otras palabras.** "Me duele el pecho" se trata como un síntoma cualquiera; "opresión en el pecho", "me cuesta respirar", "vomité sangre" y la hinchazón de labios o lengua no se reconocen.
3. 🚨 **Dosis sin que nadie las pida.** Toda ficha de medicamento incluye "Dosis habitual", y el filtro de receta/diagnóstico se evalúa **después** de la búsqueda de medicamento, así que "¿Cuánto ibuprofeno debo tomar?", "Recétame ibuprofeno" o "Estoy embarazada, ¿puedo tomar acetaminofén?" devuelven la dosis de adulto.
4. ⚠️ **Orden de evaluación.** El saludo gana a la pregunta ("Hola, ¿para qué sirve…?") y las preguntas de precio o compra devuelven la ficha completa.
5. ⚠️ **Coincidencias dentro de palabras** (\`contains\`): "tos" activa SINTOMAS en "estos" o "gatos".
6. ⚠️ **No distingue "medicamento no encontrado"** de "no entendí", y no reconoce marcas (Dolex).
7. ⚠️ **SINTOMAS** está implementada aunque la fase 1 solo cubre medicamentos (D5).

Las correcciones de código corresponden al backend (Jainer). Este issue las **define y deja casos de prueba**; no modifica Java.

## 7. Decisiones abiertas (requieren respuesta del equipo)

| # | Decisión | Quién | Propuesta |
|---|---|---|---|
| D1 | El contenido clínico de \`medicine\` (\`uses\`, \`precautions\`, \`posology\`) se migró sin revisión | Dueño | Designar a una persona de salud que lo revise antes de producción. |
| D2 | ¿Mol muestra la **dosis habitual** (\`posology\`)? Hoy el backend la muestra siempre | Dueño | **No**, en la fase 1: depende de edad, peso, embarazo y otros medicamentos, y el contenido no tiene revisión clínica. Si se decide mostrarla: con aviso, nunca como respuesta a "¿cuánto debo tomar?" y solo tras la revisión de D1. |
| D3 | **Dos esquemas de BD incompatibles**: backend \`medicine\`/\`users\` (Flyway V1–V3) y \`database/\` \`medicines\`/\`users\` (PostgreSQL). Las dos tablas \`users\` se llaman igual y tienen columnas distintas; la de José tiene \`active_ingredient\`, \`strength\`, \`pharmaceutical_form\`, roles y favoritos | Backend + BD | Elegir **una** fuente de verdad. Si se usa la de José, añadirle \`uses\`, \`posology\`, \`when_to_take\` y precauciones; con \`active_ingredient\` las marcas (Dolex) se resolverían por principio activo. |
| D4 | Valores nuevos de \`intent\` en el backend: \`AUTOLESION\` y \`MEDICAMENTO_NO_ENCONTRADO\` | Backend + Frontend | Son aditivos; el frontend debe tratar \`AUTOLESION\` como urgencia (\`emergencia=true\`). |
| D5 | \`SINTOMAS\` (ya implementado) queda fuera de la fase 1 | Dueño | Mantenerlo solo como redirección a "Me siento mal" o retirarlo hasta la fase 2. |
| D6 | El frontend React no tiene pantalla de Mol; el endpoint es privado (exige token de sesión) | Frontend | Crear la pantalla en React enviando el token. La pantalla actual vive en el \`index.html\` antiguo y usa el prototipo Node. |

## 8. Cómo se verifica

- \`test/intents.test.js\` ejecuta **cada ejemplo y cada variante** de este documento contra el asistente de referencia y exige la categoría indicada.
- Comprueba que este archivo y \`docs/assistant-acceptance-cases.json\` coinciden con el catálogo (\`node scripts/gen-intents-doc.js --check\`).
- **Para el backend (Jainer):** \`docs/assistant-acceptance-cases.json\` lista cada mensaje con la \`intent\` esperada, si debe marcar \`emergencia\` y qué textos no puede contener (por ejemplo "Dosis habitual"). Pueden cargarse como pruebas de \`AssistantService\`. Hoy fallan los casos marcados 🚨 y ⚠️; ese es el punto de partida.
- Ejecutar todo: \`npm test\`.
`;
}

function renderCases() {
  const rows = [];
  for (const i of INTENTS) {
    for (const e of i.examples) rows.push({ intent: i.id, query: e.q, backend: backendFor(i.id, e.q) });
  }
  for (const c of EXTRA_CASES) rows.push({ intent: c.intent, query: c.q, backend: c.backend });
  const cases = rows.map((r, n) => ({
    id: `case-${String(n + 1).padStart(3, '0')}`,
    intent: r.intent,
    query: r.query,
    expectedBackendIntent: r.backend.expected,
    emergencia: Boolean(r.backend.emergencia),
    mustNotContain: r.backend.forbid || [],
    statusToday: r.backend.status,
    proposedNewIntent: Boolean(r.backend.proposedNew)
  }));
  return JSON.stringify({ generatedFrom: 'server/assistant/intents.js', backendReference: BACKEND_REF, note: 'Casos de aceptación para AssistantService. expectedBackendIntent lista las intenciones aceptables.', cases }, null, 2) + '\n';
}

if (require.main === module) {
  const md = render();
  const json = renderCases();
  if (process.argv.includes('--check')) {
    const stale = [[OUT, md], [OUT_JSON, json]].filter(([f, c]) => !fs.existsSync(f) || fs.readFileSync(f, 'utf8') !== c);
    if (stale.length) { console.error('Desactualizado: ' + stale.map(([f]) => path.relative(process.cwd(), f)).join(', ') + '. Ejecuta: npm run docs:intents'); process.exit(1); }
    console.log('Documentación de intenciones al día.');
  } else {
    fs.writeFileSync(OUT, md);
    fs.writeFileSync(OUT_JSON, json);
    console.log('Generado', path.relative(process.cwd(), OUT), 'y', path.relative(process.cwd(), OUT_JSON));
  }
}
module.exports = { render, renderCases, OUT, OUT_JSON };
