#!/usr/bin/env bash
# Uso: DATABASE_URL=postgresql://... bash database/backup.sh
# Genera un respaldo en formato custom (comprimido) dentro de BACKUP_DIR (por defecto ./backups).
set -euo pipefail
: "${DATABASE_URL:?Define DATABASE_URL}"
OUT_DIR="${BACKUP_DIR:-./backups}"
mkdir -p "$OUT_DIR"
FILE="$OUT_DIR/medicore_$(date +%Y%m%d_%H%M%S).dump"

pg_dump "$DATABASE_URL" --format=custom --no-owner --no-privileges --file "$FILE"
pg_restore --list "$FILE" > /dev/null   # comprueba que el archivo es legible
echo "Respaldo creado: $FILE"
