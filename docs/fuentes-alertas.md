Fuentes externas de informacion epidemiologica y ambiental (issue #56)
El modulo de Alertas por Temporada ahora puede alimentarse de fuentes oficiales: cada alerta importada guarda de donde vino y cuando se consulto, y si una fuente falla se registra el fallo en vez de inventar datos.

Fuentes evaluadas
Fuente	Que ofrece	Decision
INS - Instituto Nacional de Salud (boletines epidemiologicos y datos abiertos en datos.gov.co, API Socrata)	eventos por municipio/departamento, fechas y nivel de riesgo	Seleccionada para dengue, IRA, EDA, etc.
IDEAM - alertas hidrometeorologicas	avisos de crecientes, sequias, temperaturas	Evaluada; su publicacion no es una API estable, se cubre el clima con Open-Meteo
Open-Meteo (api.open-meteo.com, publica, sin clave)	temperatura maxima/minima diaria por coordenada	Seleccionada para alertas de calor y frio
Polen	concentracion de polen	Descartada: la API no ofrece datos confiables para Colombia. Sin datos, no se genera alerta
OMS/OPS y alertas nacionales	boletines regionales	Fuera de alcance de esta iteracion
El calendario epidemiologico del INS se usa como referencia de categorias: las alertas se agrupan en Enfermedad transmitida por vectores, Enfermedad respiratoria, Enfermedad diarreica, Enfermedad prevenible por vacuna y Vigilancia epidemiologica.

Como se activan
Ambas fuentes vienen apagadas por defecto (dev sin internet). Nada de credenciales: las dos APIs son publicas.

powershell


$env:SOURCES_WEATHER_ENABLED='true'
$env:SOURCES_INS_ENABLED='true'
$env:SOURCES_INS_URL='https://www.datos.gov.co/resource/<id-del-dataset>.json?$limit=50'
Variable	Por defecto	Para que
SOURCES_TIMEOUT_MS	8000	espera maxima por fuente
SOURCES_WEATHER_ENABLED	false	enciende Open-Meteo
SOURCES_WEATHER_CITY / _REGION	Valledupar / Cesar	ubicacion de la alerta climatica
SOURCES_WEATHER_LAT / _LON	10.4631 / -73.2532	coordenada consultada
SOURCES_WEATHER_CALOR_MEDIO / _CALOR_ALTO	35 / 38	umbrales de calor (grados)
SOURCES_WEATHER_FRIO_MEDIO / _FRIO_ALTO	5 / 0	umbrales de frio (grados)
SOURCES_INS_ENABLED	false	enciende los boletines del INS
SOURCES_INS_URL	dataset de ejemplo	URL Socrata del boletin vigente
Endpoints
Privados (por sesion); no cuelgan de /api/v1/alerts para no quedar publicos.

Metodo	Ruta	Descripcion
POST	/api/v1/alert-sources/refresh	consulta las fuentes ahora y devuelve el resumen
GET	/api/v1/alert-sources	estado de la ultima corrida de cada fuente
POST /api/v1/alert-sources/refresh
json


{
  "fuentes": 2,
  "nuevas": 3,
  "actualizadas": 1,
  "descartadas": 2,
  "fallidas": 1,
  "detalle": [
    {
      "sourceId": "open-meteo",
      "nombre": "Open-Meteo (clima)",
      "status": "OK",
      "alertsImported": 1,
      "errorMessage": null,
      "startedAt": "2026-11-14T08:10:00",
      "finishedAt": "2026-11-14T08:10:01"
    },
    {
      "sourceId": "ins",
      "nombre": "INS - boletines epidemiologicos",
      "status": "ERROR",
      "alertsImported": 0,
      "errorMessage": "NO_DISPONIBLE: El boletin del INS no respondio a tiempo",
      "startedAt": "2026-11-14T08:10:01",
      "finishedAt": "2026-11-14T08:10:09"
    }
  ]
}
status es OK, ERROR (con motivo) o SIN_CORRIDAS (aun no se consulto).

Normalizacion
Cada adaptador devuelve ExternalAlert (objeto neutral) y el servicio la mapea a season_alert:

Campo de la fuente	Columna
titulo del evento	title (160)
descripcion	description (2000; si falta, se indica la fuente)
evento/enfermedad	category (80, mapeada a categorias conocidas)
nivel de riesgo	risk_level (BAJO/MEDIO/ALTO/CRITICO)
municipio	city (null si es regional)
departamento	region (por defecto Nacional)
fuente	source (nombre legible)
fechas	starts_on / ends_on
id de la fuente	origin (ej. ins, open-meteo)
id del registro	external_id
momento de la consulta	fetched_at
Reglas de calor/frio (Open-Meteo): maxima >= 38 → ALTO, >= 35 → MEDIO; minima <= 0 → ALTO, <= 5 → MEDIO. Si no se cruza ningun umbral no se genera alerta.

Criterios de aceptacion y como se cumplen
Criterio	Como
Alertas de fuentes identificables	columnas origin, source, external_id, fetched_at
Se adaptan al modelo de BD	se guardan en season_alert con las validaciones del modelo
Se conserva la procedencia	origin + source + fetched_at en cada alerta
No se presentan datos inexistentes	filas sin titulo o sin fecha se descartan (descartadas), y las vencidas quedan inactivas
Gestiona fallos externos	alert_source_run con estado y motivo; el resto de fuentes sigue