# Despliegue del Backend en produccion

## Proveedor elegido
- Backend: **Render** (Web Service gratis, Docker, HTTPS)
- Base de datos: **Neon** (PostgreSQL gratis, serverless)

## 1. Base de datos (Neon)
Crear proyecto y copiar la cadena de conexion. Variables:
| Variable | Valor |
|---|---|
| DB_URL | jdbc:postgresql://<host>/medicore?sslmode=require |
| DB_USER | usuario |
| DB_PASSWORD | clave |

Flyway crea el esquema (V1..V8) y las semillas al arrancar.

## 2. Backend (Render)
- New -> Blueprint (usa render.yaml) o Web Service -> Docker
- Root Directory: backend/api/api
- Health Check Path: /api/v1/health
- Variables: SPRING_PROFILES_ACTIVE=prod, DB_URL, DB_USER, DB_PASSWORD,
  CORS_ALLOWED_ORIGINS (y opcionalmente MAIL_*, ASSISTANT_*, SOURCES_*)

## 3. CORS
CORS_ALLOWED_ORIGINS=https://<frontend>.vercel.app (sin localhost)

## 4. Frontend
Definir VITE_API_URL=https://<backend>.onrender.com en el hosting.
Pendiente conocido: ChatAssistant.jsx aun apunta a localhost:3000 y no envia token.

## 5. Verificacion
.\scripts\verificar-produccion.ps1 -BaseUrl https://<backend>.onrender.com
(con -Origin para probar CORS)

## 6. Secretos
Solo variables de entorno. render.yaml usa sync:false para las credenciales.
Ojo: frontend/.env ya esta trackeado en el repo (sacarlo con git rm --cached).

## 7. Problemas tipicos
- timeout publico -> la app escucha en 127.0.0.1 (falta perfil prod)
- Schema-validation -> Flyway no corrio / DB_URL incorrecta
- Connection refused -> Neon suspendida o falta sslmode=require
- CORS -> origen no listado
- primer request ~30 s -> cold start del plan gratuito
