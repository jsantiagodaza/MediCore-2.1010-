Autenticacion, autorizacion y botiquin personal
Esta issue cierra el sistema de autenticacion/autorizacion y agrega lo que faltaba: el botiquin personal en el backend (antes solo vivia en el localStorage del navegador).

Lo que ya estaba implementado (verificado)
Actividad de la issue	Donde esta
Registro de usuarios	POST /api/v1/auth/register → AuthService.register
Inicio de sesion	POST /api/v1/auth/login → token aleatorio de 256 bits
Cierre de sesion	POST /api/v1/auth/logout → marca la sesion como revocada
Contrasenas con hash	BCrypt (fuerza 10) en PasswordConfig; se guarda solo password_hash
Validacion de tokens	AuthTokenInterceptor + AuthService.authenticate
Endpoints privados	WebConfig: todo /api/** privado salvo health, auth y catalogos publicos
Expiracion y revocacion	tabla user_session (expires_at, revoked); tokens guardados como SHA-256
Sesiones del usuario	GET /api/v1/me/sessions, DELETE /api/v1/me/sessions/{id}
Reglas de seguridad que ya se cumplen:

La contrasena nunca se guarda en texto plano: users.password_hash es BCrypt con salt. El token tampoco: user_session.token_hash es SHA-256.
Sin Authorization: Bearer <token> valido, cualquier ruta privada responde 401.
Cada token pertenece a un unico usuario; no hay forma de pedir "el usuario" por parametro.
Lo nuevo: botiquin personal
Tabla user_kit_item (migracion V7__create_user_kit.sql):

Columna	Tipo	Notas
id	bigint identity	PK
user_id	bigint	FK a users (on delete cascade)
medicine_id	bigint	FK a medicine
quantity	int	1 a 99
notes	varchar(300)	opcional
created_at, updated_at	timestamp	
Restriccion uq_kit_user_medicine (user_id, medicine_id): el mismo medicamento no se duplica en el botiquin.

Endpoints
Todos privados y siempre acotados al usuario del token.

Metodo	Ruta	Descripcion
GET	/api/v1/me/kit	Lista mi botiquin (ordenado por nombre)
GET	/api/v1/me/kit/{medicineId}	Un item mio (404 si no lo tengo)
PUT	/api/v1/me/kit	Agrega o actualiza (upsert) por medicineId
DELETE	/api/v1/me/kit/{medicineId}	204 si lo tenia, 404 si no
PUT /api/v1/me/kit
json


{ "medicineId": 12, "quantity": 2, "notes": "caja nueva" }
medicineId obligatorio; quantity opcional (por defecto 1, rango 1–99); notes opcional (máx. 300). Respuesta 200:

json


{
  "id": 5,
  "medicineId": 12,
  "name": "Ibuprofeno 400 mg",
  "category": "Analgésico",
  "quantity": 2,
  "notes": "caja nueva",
  "updatedAt": "2026-11-14T02:10:00"
}
Errores
Caso	Estado
Sin token / token invalido o caducado	401
medicineId ausente o cantidad fuera de rango	400
Medicamento inexistente en el catalogo	400
Item que no es mio (o no existe)	404
Aislamiento entre usuarios
El user_id nunca llega por cuerpo ni por URL: sale del token. Todas las consultas del repositorio incluyen al usuario (findByUserAndMedicine, findByUserOrderByMedicineNameAsc), asi que pedir el medicamento de otro produce 404, no el dato ajeno.

Pruebas
powershell


cd backend\api\api
.\mvnw.cmd test '-Dtest=Kit*Test,EndpointSecurityTest'
Archivo	Que cubre
KitServiceTest (8)	alta, upsert sin duplicar, borrado, aislamiento, medicamento inexistente, cantidad y nota fuera de rango
KitEndpointTest (5)	401 sin token, alta + listado, borrado, aislamiento entre usuarios (GET/DELETE ajenos → 404), 400 sin medicamento
EndpointSecurityTest (ya existia)	rutas publicas/privadas, tokens invalidos, revocacion y cierre de sesion
Nota para el equipo
V7 es la siguiente migracion despues de V6; coordinar con Jose antes de aplicarla en PostgreSQL. Solo agrega una tabla nueva con FK a users y medicine; no modifica tablas existentes.
