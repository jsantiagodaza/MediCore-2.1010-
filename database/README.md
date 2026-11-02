# Base de datos MediCore (PostgreSQL)

## Estructura
- `schema/` migraciones versionadas (001 medicines, 002 users, 003 índices, 004 favoritos)
- `seeds/` datos **de demostración** (separados del esquema; no son datos reales)
- `queries/` consultas principales (#27)
- `docs/er-diagram.md` modelo ER
- `migrate.sh` ejecuta migraciones pendientes y, opcionalmente, los seeds

## Ejecutar desde una base vacía (Git Bash)
```bash
psql -U postgres -c "CREATE DATABASE medicore;"
export DATABASE_URL=postgresql://postgres:TU_CLAVE@localhost:5432/medicore
WITH_SEEDS=1 bash database/migrate.sh
```
Sin `WITH_SEEDS=1` solo se crea el esquema. Volver a ejecutarlo es seguro: las migraciones aplicadas se registran en `schema_migrations` y los seeds usan `ON CONFLICT DO NOTHING`.

## Verificar
```sql
\dt
SELECT count(*) FROM medicines;   -- 6
SELECT email, role FROM users;    -- 2 usuarios demo
```

## Verificación de persistencia desde Spring Boot (#28)
`application.properties`:
```properties
spring.datasource.url=jdbc:postgresql://localhost:5432/medicore
spring.datasource.username=postgres
spring.datasource.password=${DB_PASSWORD}
spring.jpa.hibernate.ddl-auto=validate   # NO create/create-drop: el esquema lo manda database/
```
Pasos:
1. Arrancar la app y consultar el catálogo por la API (ej. `GET /api/medicines`): deben aparecer los 6 seeds.
2. Crear un medicamento por la API, **reiniciar la aplicación** y consultarlo de nuevo: debe seguir ahí.
3. Confirmar en `psql` que la fila existe y que no hay listas en memoria (`List<Medicine>` estáticas) en servicios/repositorios.
4. Si usa JPA: la entidad debe mapear `@Table(name = "medicines")` y `@Column(name = "active_ingredient")`, etc. (o `SpringPhysicalNamingStrategy` por defecto).
