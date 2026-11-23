#!/usr/bin/env bash
# Creates a throwaway Postgres database with the Supabase stand-ins and the product migrations, for the database tests.
#   PGHOST=localhost PGUSER=postgres PGPASSWORD=… scripts/test-db.sh otto_test
set -euo pipefail
db="${1:-otto_test}"
psql -v ON_ERROR_STOP=1 -qc "DROP DATABASE IF EXISTS $db" -c "CREATE DATABASE $db" postgres
psql -v ON_ERROR_STOP=1 -q -f supabase/tests/stubs.sql "$db"
for name in editor_schema social_schema editor_social_roles drive_schema analytics_schema analytics_goals videohosting_schema inbox_schema inbox_reliability inbox_automations inbox_tick_cron inbox_sales inbox_deals inbox_segments inbox_broadcasts inbox_teams; do
  file=$(ls supabase/migrations/*_"$name".sql)
  psql -v ON_ERROR_STOP=1 -q -f "$file" "$db" > /dev/null
done
echo "database $db ready"
