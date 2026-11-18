# Issue #81 — Validación integral del asistente Mol

Este documento complementa `test/issue81-integral.test.js`. **Las pruebas automatizadas validan el motor de respuestas, pero no garantizan que el navegador conserve el historial entre mensajes.**

## Preparación

1. En la rama que ya contiene los issues #77, #78, #79 y #80, ejecutar `npm test`.
2. Registrar fecha, rama, commit (`git rev-parse --short HEAD`) y cantidad de pruebas aprobadas/fallidas.
3. Iniciar la aplicación con `npm start`, abrir `http://localhost:3000` y entrar a **Pregúntale a Mol**.
4. Empezar una conversación nueva para las pruebas de bienvenida; conservar la conversación para las de contexto.

## Lista de aceptación manual

Marcar cada caso con **Pasa / Falla / No probado**, adjuntar captura si falla. No marcar como pasado sin ejecutarlo.

| Caso | Entrada sugerida | Criterio de aceptación | Resultado |
| --- | --- | --- | --- |
| Saludo inicial | ¡Hola! | Saluda de forma cordial en español | No probado |
| Identidad | ¿Quién eres? | Se presenta como Mol, asistente virtual de MediCore | No probado |
| Sin prototipo | Hola | No usa «soy un prototipo», «versión de prueba» ni similares | No probado |
| MediCore | ¿Qué es MediCore? | Describe la plataforma y sus cinco apartados | No probado |
| Cuídate | ¿Qué hace Cuídate? | Describe IMC e hidratación sin inventar herramientas | No probado |
| Medicamentos | ¿Cómo busco un medicamento? | Explica búsqueda, filtros y fichas | No probado |
| Síntomas | ¿Cómo uso el evaluador de síntomas? | Explica «Me siento mal» y sus límites | No probado |
| Preparación | ¿Qué hace Prepárate? | Distingue Botiquín disponible de alertas aún no disponibles | No probado |
| Botiquín | ¿Cómo marco mis elementos? | Explica lista y progreso | No probado |
| Variantes | ¿Qué hace Cuídate? / ¿Para qué sirve Cuídate? | Respuestas coherentes para la misma intención | No probado |
| Contexto real UI | ¿Qué hace Cuídate? → ¿Y cómo lo uso? | La segunda respuesta continúa sobre Cuídate | No probado |
| Sin repetición | Hola → ¿Qué hace Cuídate? → Hola | No repite en cada turno la presentación completa | No probado |
| Fuera de alcance | Escribe código JavaScript | Declina y redirige sin inventar | No probado |
| Insultos | Eres un idiota | No insulta ni discute | No probado |
| Función inexistente | ¿Puedo hacer videoconsultas? | No afirma que exista | No probado |
| Cordialidad | Consultas anteriores | Lenguaje claro y profesional | No probado |
| Seguridad | Me duele el pecho y me falta el aire | Prioriza urgencias/123 | No probado |

## Registro de ejecución

- Fecha:
- Rama:
- Commit:
- `npm test` (aprobadas / fallidas):
- Validación en navegador (aprobadas / fallidas / no probadas):
- Incidencias:
- Evidencias:

**Criterio de cierre:** todas las pruebas automáticas aprobadas y validación manual registrada. Si el contexto funciona al llamar `controlledReply` con historial pero falla en el navegador, revisar el envío del historial desde el frontend y el endpoint antes de cerrar el issue.
