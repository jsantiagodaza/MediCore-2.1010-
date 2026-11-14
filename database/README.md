# Base de datos MediCore (PostgreSQL)

## Estructura
- `schema/` migraciones versionadas, se ejecutan en orden numérico:
  001 medicines · 002 users · 003 índices · 004 favoritos · 005 alertas (#59) · 006 preferencias y notificaciones (#60) · 007 botiquín (#62) · 008 consolidación de usuarios (#61) · 009 datos de referencia (#63)
- `seeds/` datos **de demostración** (nunca en producción)
- `queries/` consultas principales: `main_queries.sql`, `alerts_queries.sql`, `kit_queries.sql`, `verify_integrity.sql`
- `docs/er-diagram.md` modelo ER y documentación del esquema
- `migrate.sh`, `backup.sh`, `restore.sh` scripts de operación · `.env.example` plantilla de conexión

## Qué es dato de referencia y qué es dato de prueba
- **Referencia (migración 009, necesaria en producción):** niveles de riesgo, categorías de alerta, fuentes de información y regiones iniciales. Es idempotente (`ON CONFLICT DO NOTHING`); para agregar más regiones o fuentes, crea una migración nueva con el mismo patrón.
- **Demostración (`seeds/`):** medicamentos, usuarios, alertas y botiquín ficticios. Solo se cargan con `WITH_SEEDS=1`. Los hashes de los usuarios demo son marcadores; genera hashes BCrypt reales antes de usarlos para iniciar sesión.

## Crear la base desde cero (Git Bash)
```bash
psql -U postgres -c "CREATE DATABASE medicore;"
export DATABASE_URL=postgresql://postgres:TU_CLAVE@localhost:5432/medicore
bash database/migrate.sh                 # solo esquema y datos de referencia (producción)
WITH_SEEDS=1 bash database/migrate.sh    # además, datos de demostración (desarrollo)
```
- Cada migración se ejecuta en **una sola transacción**: si falla, no queda a medias.
- Las ya aplicadas se registran en `schema_migrations` y se omiten, así que repetir el comando es seguro.
- **Regla:** nunca edites una migración ya aplicada; crea una nueva (`010_...sql`).

## Conexión a la instancia remota
1. Copia `.env.example` a `.env` y completa `DATABASE_URL` con el host remoto. Agrega `?sslmode=require` si el proveedor lo exige.
2. Carga las variables (`set -a; source database/.env; set +a`) y ejecuta `bash database/migrate.sh`.
3. `.env` y `backups/` están en `.gitignore`: no subas credenciales ni respaldos al repositorio.
4. Spring Boot: usa las mismas credenciales por variables de entorno (`SPRING_DATASOURCE_URL`, `SPRING_DATASOURCE_USERNAME`, `SPRING_DATASOURCE_PASSWORD`) y `spring.jpa.hibernate.ddl-auto=validate`, para que el esquema lo controlen solo las migraciones.

## Respaldo y restauración
Requiere `pg_dump` y `pg_restore` (vienen con PostgreSQL).
```bash
# Respaldo (formato comprimido, verifica que el archivo sea legible)
bash database/backup.sh                  # crea backups/medicore_AAAAMMDD_HHMMSS.dump

# Restauración de prueba en una base distinta
psql "$DATABASE_URL" -c "CREATE DATABASE medicore_restore_test;"   # o créala desde el panel del proveedor
TARGET_DATABASE_URL=postgresql://.../medicore_restore_test bash database/restore.sh backups/ARCHIVO.dump
```
- `restore.sh` se niega a restaurar sobre la base en uso (`DATABASE_URL`) salvo que pongas `FORCE=1`.
- Recomendado: un respaldo diario (cron o la función de respaldo automático del proveedor), conservar al menos los últimos 7 y **probar la restauración periódicamente**.
- Tras restaurar, comprueba: `SELECT count(*) FROM medicines;` y `SELECT count(*) FROM schema_migrations;` (debe coincidir con el número de migraciones).

## Verificar persistencia tras reiniciar el servidor
1. Con la app y la base remota en marcha, crea un dato (ej. un medicamento en el botiquín de un usuario de prueba).
2. Reinicia la aplicación Spring Boot **y** el servicio de la base (o reinicia la instancia desde el panel del proveedor).
3. Consulta de nuevo por la API y en `psql`: el dato debe seguir ahí y asociado a su usuario.
4. Confirma que no hay listas en memoria haciendo de «base de datos» en servicios o repositorios.

## Verificar integridad
- `queries/verify_integrity.sql`: en todos los bloques lo esperado es **0 filas** (tablas sin PK, índices duplicados, FKs sin índice, correos repetidos o sin normalizar, registros inconsistentes del botiquín). El último bloque (notificaciones de usuarios sin preferencias) solo informa.
- Las consultas de `queries/` usan el usuario demo; cambia el correo por el tuyo. Las sentencias que modifican datos están comentadas.

## Estado de pruebas
Las migraciones 001 a 009, los seeds, las consultas, `backup.sh` y `restore.sh` se probaron desde una base vacía en PostgreSQL 16. Las restricciones rechazaron los datos inválidos esperados, no se mezclaron registros entre usuarios y la restauración reprodujo los datos. Falta probar contra **tu instancia remota** y revisar el esquema con backend.
