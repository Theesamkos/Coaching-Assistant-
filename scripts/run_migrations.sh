#!/usr/bin/env bash
set -euo pipefail

# Simple migration runner for local DBs using psql.
# Requires: DATABASE_URL environment variable (Postgres connection string).

: "${DATABASE_URL:?Please set DATABASE_URL (e.g. postgresql://user:pass@host:port/db)}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MIGRATIONS_DIR="$SCRIPT_DIR/../Coaching Assistant Tasks/migrations"

FILES=(
  "00_profiles.sql"
  "01_core_tables.sql"
  "02_triggers_and_rls.sql"
  "03_seed_data_and_views.sql"
)

echo "Using migrations directory: $MIGRATIONS_DIR"

for f in "${FILES[@]}"; do
  FILEPATH="$MIGRATIONS_DIR/$f"
  if [ ! -f "$FILEPATH" ]; then
    echo "Warning: migration file not found: $FILEPATH"
    exit 1
  fi
  echo "Applying $f..."
  psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f "$FILEPATH"
done

echo "All migrations applied."
