# Ejecutar el prototipo del asistente

Requisitos: Node.js ≥ 20 (sin dependencias).

```bash
npm start                      # http://localhost:3000  → pestaña "Pregúntale a Mol"
npm test                       # pruebas (incluye el catálogo de intenciones)
npm run docs:intents           # regenera docs/assistant-intents.md desde server/assistant/intents.js
# IA opcional (solo servidor; sin probar contra la API real):
ASSISTANT_PROVIDER=anthropic ANTHROPIC_API_KEY=... npm start
```
Alcance de Mol (intenciones): [`assistant-intents.md`](assistant-intents.md) · Seguridad, contrato y limitaciones: [`ai-safety.md`](ai-safety.md) · Ejemplos: [`test-examples.md`](test-examples.md)
