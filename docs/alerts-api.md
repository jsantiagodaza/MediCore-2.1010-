# API de alertas por temporada (issue #52)

## Autenticacion

| Rutas | Acceso |
|---|---|
| `/api/v1/alerts/**` | Publico |
| `/api/v1/me/alert-preferences` | Privado: `Authorization: Bearer <token>` |

Las preferencias se guardan para el usuario del token; el `user_id` nunca
viaja en el cuerpo, asi que nadie puede tocar las de otro.

## Endpoints

| Metodo | Ruta | Descripcion |
|---|---|---|
| GET | `/api/v1/alerts` | Lista con filtros |
| GET | `/api/v1/alerts/filters` | Valores para los combos |
| GET | `/api/v1/alerts/{id}` | Detalle (404 si no existe) |
| GET | `/api/v1/me/alert-preferences` | Preferencias (404 si no hay) |
| PUT | `/api/v1/me/alert-preferences` | Crea o actualiza |
| DELETE | `/api/v1/me/alert-preferences` | Borra (204, idempotente) |

## Filtros de GET /api/v1/alerts

| Parametro | Ejemplo | Notas |
|---|---|---|
| `city` | `Valledupar` | exacto, sin distinguir mayusculas |
| `region` | `Cesar` | exacto |
| `category` | `Clima extremo` | debe existir en la BD |
| `riskLevel` | `alto` | `bajo`, `medio`, `alto`, `critico`; acepta tildes |
| `active` | `true` | `false` = cerradas; omitido = ambas |

Se combinan con Y. Sin coincidencias: `200` con `[]`.

### Respuesta

```json
[
  {
    "id": 1,
    "title": "Dengue en aumento en Valledupar",
    "description": "Los casos de dengue confirmados se incrementaron...",
    "category": "Enfermedad transmitida por vectores",
    "riskLevel": "ALTO",
    "city": "Valledupar",
    "region": "Cesar",
    "source": "Secretaria de Salud del Cesar",
    "startsOn": "2026-11-01",
    "endsOn": "2026-12-31",
    "active": true,
    "createdAt": "2026-11-01T08:00:00"
  }
]