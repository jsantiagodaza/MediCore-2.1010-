#!/usr/bin/env bash
# Uso:  DATABASE_URL=postgresql://usuario:clave@localhost:5432/medicore bash database/migrate.sh
#       WITH_SEEDS=1 DATABASE_URL=... bash database/migrate.sh     (incluye datos de demostración)
set -euo pipefail
: "${DATABASE_URL:?Define DATABASE_URL}"
DIR="$(cd "$(dirname "$0")" && pwd)"
PSQL="psql $DATABASE_URL -v ON_ERROR_STOP=1 -q"

$PSQL -c "CREATE TABLE IF NOT EXISTS schema_migrations (
            filename TEXT PRIMARY KEY, applied_at TIMESTAMPTZ NOT NULL DEFAULT now());"

for f in "$DIR"/schema/*.sql; do
  name="$(basename "$f")"
  done_already=$($PSQL -tA -c "SELECT 1 FROM schema_migrations WHERE filename = '$name'")
  if [ -z "$done_already" ]; then
    echo "Aplicando $name"
    $PSQL -f "$f"
    $PSQL -c "INSERT INTO schema_migrations (filename) VALUES ('$name')"
  else
    echo "Omitiendo $name (ya aplicado)"
  fi
done

if [ "${WITH_SEEDS:-0}" = "1" ]; then
  for f in "$DIR"/seeds/*.sql; do echo "Sembrando $(basename "$f")"; $PSQL -f "$f"; done
fi
echo "Listo."
