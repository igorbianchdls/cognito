# Testing

## Safe live smoke pattern

Use CLI and avoid printing tokens.

1. Pull or load environment that provides `SUPABASE_DB_URL`.
2. Get a GCP token without printing it:

```bash
TOKEN=$(cmd.exe /c "gcloud auth print-access-token" | tr -d "\r")
```

3. Run a small chunked worker payload:

```bash
GOOGLE_OAUTH_ACCESS_TOKEN="$TOKEN" \
GCP_PROJECT_ID=creatto-463117 \
DOTENV_CONFIG_PATH=/tmp/cognito-integracoes-preview-test.env \
SYNC_JOB_PAYLOAD='{"mode":"resource_chunk","tenantId":3,"connectionId":"2","trigger":"manual","resource":"clientes","pageSize":500,"requestedBy":"codex-smoke-test"}' \
node -r dotenv/config src/products/integracoes/cloud/dist/worker/index.cjs
```

Expected result for `clientes`: 33 records, no failed records. A warning about analytics can be ignored if raw and normalized validate.

## Checkpoint multi-chunk test

Use a temporary Pub/Sub topic so local chunks do not trigger the production worker:

```bash
cmd.exe /c "gcloud pubsub topics create integrations-sync-checkpoint-smoke-YYYYMMDD --project=creatto-463117"
```

Run chunk 1 without `runId`, with low `pageSize`:

```bash
PUBSUB_SYNC_TOPIC=integrations-sync-checkpoint-smoke-YYYYMMDD \
SYNC_JOB_PAYLOAD='{"mode":"resource_chunk","tenantId":3,"connectionId":"2","trigger":"manual","resource":"clientes","pageSize":10,"requestedBy":"codex-checkpoint-test"}' \
node -r dotenv/config src/products/integracoes/cloud/dist/worker/index.cjs
```

Capture `runId`, then run the same command with `runId` and no cursor until done.

Expected checkpoint sequence for 33 clientes and `pageSize=10`:

```txt
chunk 1 -> page 2, recordsIn 10
chunk 2 -> page 3, recordsIn 20
chunk 3 -> page 4, recordsIn 30
chunk 4 -> done true, recordsIn 33, chunksProcessed 4
```

Delete the temporary topic:

```bash
cmd.exe /c "gcloud pubsub topics delete integrations-sync-checkpoint-smoke-YYYYMMDD --project=creatto-463117 --quiet"
```

## Validation queries

Postgres:

```sql
select id::text, status, records_in, records_updated, records_failed, error_message, metadata
from integrations.sync_runs
where tenant_id = 3 and connection_id = '2' and id = 'RUN_ID';
```

Checkpoint:

```sql
select resource, cursor_key, cursor, last_synced_at
from integrations.sync_cursors
where tenant_id = 3 and connection_id = '2' and resource = 'clientes' and cursor_key = 'RUN_ID';
```

BigQuery raw and normalized queries are in `bigquery.md`.
