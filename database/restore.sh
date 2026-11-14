#!/usr/bin/env bash
# Uso: TARGET_DATABASE_URL=postgresql://.../medicore_restore_test bash database/restore.sh backups/archivo.dump
# Restaura en una base de DESTINO. Nunca restaura sobre DATABASE_URL (la base en uso) sin FORCE=1.
set -euo pipefail
FILE="${1:?Indica el archivo .dump a restaurar}"
: "${TARGET_DATABASE_URL:?Define TARGET_DATABASE_URL (base de destino, vacía o de prueba)}"

if [ -n "${DATABASE_URL:-}" ] && [ "$TARGET_DATABASE_URL" = "$DATABASE_URL" ] && [ "${FORCE:-0}" != "1" ]; then
  echo "Abortado: el destino es la misma base en uso. Usa una base de prueba o FORCE=1 si es intencional." >&2
  exit 1
fi

pg_restore --clean --if-exists --no-owner --no-privileges --exit-on-error \
           --dbname "$TARGET_DATABASE_URL" "$FILE"
echo "Restauración completada en el destino."
