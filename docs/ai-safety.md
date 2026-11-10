# Asistente médico informativo — Seguridad y límites (prototipo)

Issue #3 · Rama `feature/assistant-prototype` · Estado: **prototipo**, no apto para producción.

## 1. Qué es y qué no es

| Sí hace | No hace (nunca) |
|---|---|
| Información general sobre los medicamentos del catálogo (uso, cuándo se usa, precauciones sin cifras) | Diagnosticar ni sugerir qué enfermedad tiene la persona |
| (Fase 1) Solo consultas de medicamentos del catálogo. Hidratación, botiquín, navegación y orientación general están definidas para la fase 2: ver [`assistant-intents.md`](assistant-intents.md) | Indicar dosis, horarios o duración de tratamientos |
| Reconocer señales de alarma y dirigir al **123** / urgencias | Recetar ni recomendar "qué tomar" para un caso concreto |
| Recordar siempre que consulte a un profesional | Revelar instrucciones internas o claves |

Toda respuesta del endpoint incluye `mode: "prototype"` y un `disclaimer`.

## 2. Personaje: Mol Paramédico

El asistente es **Mol**, la mascota de MediCore (arte original del líder del proyecto; las imágenes ya estaban en `assets/`, no se modificaron). En la pantalla "Pregúntale a Mol" la imagen cambia según la respuesta: `mol-verde` (información), `mol-amarillo` (el asistente se niega: dosis, diagnóstico), `mol-rojo` (emergencia), `mol-toma-agua` (hidratación) y `mol_paramedico` (estado normal / botiquín).

## 3. Arquitectura

```
Frontend (pantalla "Pregúntale a Mol" en index.html + js/assistant-ui.js) ← sin claves, solo fetch al backend
        │  POST /api/v1/assistant/messages  { "message": "..." }
        ▼
server/index.js     límites de tamaño (10 KB), rate limit (30/min/IP), JSON/Content-Type, rutas estáticas con lista blanca
server/handler.js   validación (1–1000 caracteres) y armado de la respuesta
        ▼
assistant/safety.js     CAPA 1 (determinista): emergencia > autolesión > injection > diagnóstico > prescripción
assistant/engine.js     CAPA 2: respuestas controladas desde el catálogo (js/data.js)
assistant/ai-provider.js  CAPA 3 (opcional): IA solo en fase 2 y solo en preguntas fuera de las intenciones definidas + filtro de salida
```

**Principio clave:** los casos sensibles (emergencia, autolesión, injection, diagnóstico, prescripción) y las respuestas de medicamentos/hidratación/botiquín **se resuelven siempre con texto controlado**. La IA nunca decide en esos casos.

## 4. Contrato de API

> **Actualización (issue #29):** el contrato **vigente** es el del backend Spring (`AssistantController`): `POST /api/v1/assistant/messages`, ruta privada con token de sesión, mensaje de hasta 500 caracteres, respuesta `{ id, respuesta, intent, confianza, emergencia, sugerencias, fuentes, datos, timestamp }` con `intent` ∈ `SALUDO | MEDICAMENTO | SINTOMAS | EMERGENCIA | FUERA_DE_ALCANCE | NO_ENTENDIDO`. Ver [`assistant-intents.md`](assistant-intents.md) §6.
>
> Lo que sigue describe el contrato del **prototipo Node** (`server/`), que ahora funciona como **referencia de comportamiento** y de pruebas, no como backend de producción.

Request: `{ "message": "string (1–1000)" }`

Response 200:
```json
{
  "id": "msg_ab12cd34ef56",
  "mode": "prototype",
  "provider": "controlled | anthropic",
  "category": "medication_info | emergency | self_harm | prompt_injection | diagnosis_refused | prescription_refused | hydration | first_aid_kit | coming_soon | medication_not_found | drug_interaction | interaction_clarification | greeting | out_of_scope",
  "safety": { "level": "ok | refused | blocked | emergency", "flags": [] },
  "reply": "texto",
  "sources": [{ "name": "…", "url": "… | null" }],
  "suggested_actions": ["…"],
  "disclaimer": "…"
}
```
Errores: `400 invalid_request | message_too_long | invalid_json`, `405`, `413 payload_too_large`, `415`, `429 rate_limited`.
Es **sin estado**: el servidor no guarda ni registra el texto del usuario (solo la categoría en logs).

## 5. Integración de IA

- **Alcance (issue #29):** en la fase 1 la IA **no interviene en ninguna respuesta**; todo es determinista. En fase 2 (`ASSISTANT_SCOPE=phase2`) solo podría responder preguntas fuera de las intenciones definidas. Detalle en [`assistant-intents.md`](assistant-intents.md).
- **Disponibilidad de API de IA: no confirmada** (no se dispuso de clave durante el desarrollo). Por eso el prototipo corre por defecto en modo `controlled`, etiquetado como prototipo.
- El código para activar IA existe (`ai-provider.js`) pero **no fue probado contra la API real**; sus pruebas usan `fetch` simulado. Se activa solo con variables de entorno del servidor:
  `ASSISTANT_PROVIDER=anthropic`, `ANTHROPIC_API_KEY=…`, opcional `ASSISTANT_MODEL`.
- La clave **nunca** llega al frontend (hay una prueba automática que lo verifica).
- Salida de la IA: se descarta y se usa la respuesta controlada si hay error de red/API, timeout (15 s) o si el filtro detecta dosis, diagnóstico o prescripción.

## 6. Controles de seguridad implementados

| Riesgo | Control | Prueba |
|---|---|---|
| Emergencia médica | Regex sobre texto normalizado (sin tildes) → respuesta fija con 123/urgencias; prioridad máxima | `assistant.test.js` |
| Autolesión | Respuesta de apoyo, 123 y persona de confianza; sin IA | ídem |
| Diagnóstico | Rechazo + señales de alarma generales + remitir a profesional | ídem |
| Dosis / prescripción | Rechazo; se omiten del catálogo los campos de dosis y las precauciones con cifras | ídem |
| Prompt injection / fuga de claves | Detección + respuesta fija; el system prompt ordena ignorar cambios de reglas | ídem |
| Salida insegura de la IA | `checkOutput()` + descarte | ídem |
| XSS | El frontend usa `textContent`, nunca `innerHTML` | revisión manual |
| Abuso / DoS | Límite de 10 KB, 1000 caracteres, 30 req/min/IP | `http.test.js` |
| Exposición de código | Solo se sirven `index.html`, `css/`, `js/`, `assets/`; sin path traversal | `http.test.js` |
| Privacidad | Sin persistencia ni log del contenido | revisión manual |

Ejecutar pruebas: `npm test` (más de 100 pruebas, sin dependencias). Ejemplos reales: `docs/test-examples.md`.

## 7. Limitaciones conocidas (leer antes de usar)

1. **Detección por palabras clave (regex):** tiene falsos negativos (frases no previstas, errores ortográficos, otros idiomas) y falsos positivos. No sustituye una evaluación clínica. Las pruebas ayudaron a detectar casos mal clasificados; habrá más.
2. **El catálogo (`js/data.js`) no tiene revisión clínica.** Viene del MVP 2025 y mezcla datos de uso con dosis. El asistente solo lee uso/cuándo/precauciones, pero el contenido sigue sin estar validado por un profesional. **Requiere revisión por personal de salud antes de cualquier uso real.**
3. **Contradicción con la pantalla "Mal" existente:** `DIAGNOSES` en `js/data.js` y la sección de síntomas del frontend muestran diagnósticos con porcentaje y medicamentos recomendados. Eso **va contra** los límites de este asistente y debería rediseñarse o retirarse (fuera del alcance de este issue; no se modificó).
4. Las pantallas actuales también muestran dosis. Se mantienen sin cambios, pero conviene decidir si se alinean con esta política.
5. **Líneas de ayuda:** solo se menciona el 123 (emergencias Colombia). Falta validar con el equipo qué líneas de salud mental/toxicología incluir y verificar que estén vigentes.
6. Las fuentes de la lista (`sources`) son referencias generales de consulta; **no se ha verificado** que cada respuesta coincida con su contenido. La fuente primaria hoy es el catálogo interno.
7. El rate limit es en memoria (se reinicia al reiniciar y no escala a varias instancias). Para producción: gateway/Redis, HTTPS, autenticación y CORS restringido (`ALLOWED_ORIGIN`).
8. **Bug previo, no tocado:** `index.html` y `js/agua.js` piden `assets/mol_toma_agua.png`, pero el archivo se llama `mol-toma-agua.png` (404 en la pantalla de agua).
9. No hay memoria de conversación: cada mensaje se evalúa aislado (más seguro, menos útil).

## 8. Próximos pasos sugeridos

- Revisión clínica del catálogo y de las respuestas controladas.
- Confirmar proveedor/clave de IA y probar `ai-provider.js` con la API real; evaluar con un set de casos adversariales más amplio.
- Evaluar clasificador de intención más robusto que regex.
- Definir política de datos (consentimiento, retención) antes de guardar cualquier conversación.
- Decidir el destino de `DIAGNOSES` / pantalla "Mal".

## Interacciones entre medicamentos (issue #64)

- **Determinista:** `server/assistant/interactions.js`. La IA nunca interviene, ni en fase 2.
- **No inventa:** solo afirma lo que está en la tabla `RULES`. Si el par no está, responde que no lo tiene registrado y que eso **no** garantiza seguridad.
- **Aclara en vez de adivinar:** nombres genéricos («un antiinflamatorio»), un solo medicamento o tres o más generan `interaction_clarification`.
- **Sin pautas de tratamiento:** nada de dosis ni horarios; no recomienda iniciar, suspender ni cambiar tratamientos; siempre remite a médico o farmacéutico.
- **Prioridad:** emergencia, autolesión, inyección, diagnóstico y dosis/embarazo/niños se evalúan antes y siguen rechazándose.
- **Pendiente antes de producción:** revisión clínica de la tabla por un profesional de farmacia y fuente bibliográfica por regla.
