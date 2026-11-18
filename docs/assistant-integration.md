Integracion del bot IA (Mol) con el Backend (issue #54)
El frontend nunca habla con el proveedor de IA: manda la pregunta al backend, el backend valida al usuario, decide si responde con reglas o con el modelo, y devuelve un JSON con formato fijo. La clave del proveedor vive solo en el servidor.

Endpoint
POST /api/v1/assistant/messages — privado (Authorization: Bearer <token>).

json


{ "message": "para que sirve el ibuprofeno" }
Validacion: message obligatorio, maximo 500 caracteres (error 400 con el formato comun de ApiExceptionHandler). Sin token: 401.

Contrato de respuesta
json


{
  "id": "8f3c...",
  "respuesta": "El ibuprofeno es un analgesico y antiinflamatorio...",
  "reply": "El ibuprofeno es un analgesico y antiinflamatorio...",
  "disclaimer": "Soy Mol, una guia informativa. No reemplazo la consulta medica ni entrego diagnosticos.",
  "intent": "MEDICAMENTO",
  "confianza": 0.9,
  "emergencia": false,
  "sugerencias": ["Consulta el catalogo de medicamentos"],
  "suggested_actions": ["Consulta el catalogo de medicamentos"],
  "fuentes": ["Catalogo MediCore"],
  "datos": { "nombre": "Ibuprofeno" },
  "origen": "REGLAS",
  "modelo": null,
  "latenciaMs": null,
  "timestamp": "2026-11-14T01:20:00Z"
}
Campo	Notas
respuesta / reply	mismo texto; reply es el que ya lee ChatAssistant.jsx
sugerencias / suggested_actions	misma lista; suggested_actions es el alias del frontend
disclaimer	aviso fijo de que Mol no reemplaza al medico
origen	REGLAS (determinista), MODELO (IA) o RESPALDO (proveedor caido)
modelo, latenciaMs	solo cuando respondio el modelo
intent	incluye RESPUESTA_MODELO para las respuestas de IA
Como decide quien responde
Reglas de seguridad (siempre primero, nunca van al modelo): emergencia, autolesion, manipulacion/injection, diagnostico, dosis o receta, precios.
Catalogo: si el mensaje nombra un medicamento conocido, responde con los datos de la base.
Saludo / sintomas / medicamento inexistente: respuestas controladas.
Si nada de lo anterior aplica (NO_ENTENDIDO) y el modelo esta encendido, se consulta al proveedor de IA.
Si el proveedor falla o se pasa del tiempo: mensaje de respaldo, origen=RESPALDO.
Variables de entorno (credenciales fuera del repositorio)
Variable	Por defecto	Para que
ASSISTANT_ENABLED	false	permite que el modelo responda
ASSISTANT_PROVIDER	none	none (solo reglas) o http (proveedor real)
ASSISTANT_ENDPOINT	
https://api.openai.com/v1/chat/completions
URL de chat completions
ASSISTANT_API_KEY	vacio	clave del proveedor
ASSISTANT_MODEL	gpt-4o-mini	modelo a usar
ASSISTANT_MAX_TOKENS	300	tope de la respuesta
ASSISTANT_TIMEOUT_MS	8000	espera maxima antes del respaldo
Compatible con cualquier proveedor que hable chat completions estilo OpenAI: OpenAI, Groq, OpenRouter, Together, Ollama o vLLM (en los locales se puede dejar ASSISTANT_API_KEY con un valor cualquiera).

powershell


$env:ASSISTANT_ENABLED='true'
$env:ASSISTANT_PROVIDER='http'
$env:ASSISTANT_ENDPOINT='https://api.openai.com/v1/chat/completions'
$env:ASSISTANT_API_KEY='sk-...'
$env:ASSISTANT_MODEL='gpt-4o-mini'
Errores y tiempos de espera
Timeout de conexion y de lectura: ASSISTANT_TIMEOUT_MS (ambos).
RestClientResponseException (4xx/5xx del proveedor), ResourceAccessException (timeout/red) y JSON inesperado se convierten en AssistantProviderException con motivo (TIEMPO_AGOTADO, ERROR_PROVEEDOR, SIN_CONFIGURACION).
El usuario nunca ve el detalle tecnico: recibe el mensaje de respaldo y el error queda en el log del servidor (sin la clave ni el cuerpo del proveedor).
La respuesta del modelo se normaliza: se quitan bloques de codigo, se colapsan espacios y se recorta a 600 caracteres.
Proteccion de credenciales
La clave solo se lee de ASSISTANT_API_KEY; no esta en application.properties ni en el repositorio.
Solo el backend arma la peticion al proveedor; el frontend no conoce URL ni clave.
Los logs registran el codigo HTTP, nunca el header Authorization.
Pruebas
powershell


cd backend\api\api
.\mvnw.cmd test '-Dtest=AssistantChat*Test,AssistantContractEndpointTest'