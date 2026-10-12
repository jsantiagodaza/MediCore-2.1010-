# Ejecutar el prototipo del asistente

Requisitos: Node.js ≥ 20 (sin dependencias).

```bash
npm start                      # http://localhost:3000  → abrir /assistant.html
npm test                       # 43 pruebas
# IA opcional (solo servidor; sin probar contra la API real):
ASSISTANT_PROVIDER=anthropic ANTHROPIC_API_KEY=... npm start
```
Seguridad, contrato y limitaciones: [`ai-safety.md`](ai-safety.md) · Ejemplos: [`test-examples.md`](test-examples.md)
