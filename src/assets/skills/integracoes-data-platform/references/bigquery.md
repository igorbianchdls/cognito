# BigQuery

## Dataset model

For tenant 3 tests:

```txt
raw:        org_3_raw
normalized: org_3_normalized
analytics:  org_3_analytics
```

Raw and normalized are the primary layers. Analytics/views are auxiliary unless explicitly requested.

## Raw semantics

- Raw writes use BigQuery `insertAll`.
- Raw is append-oriented and includes:
  - `tenant_id`
  - `connection_id`
  - `provider`
  - `resource`
  - `run_id`
  - `external_id`
  - `synced_at`
  - `raw_payload`

Validate raw by `run_id`:

```sql
select count(1) as row_count
from `creatto-463117.org_3_raw.conta_azul_clientes`
where run_id = 'RUN_ID';
```

## Normalized semantics

- Normalized tables use canonical business columns.
- Normalized rows usually use `source_run_id`, not `run_id`.

Validate normalized by `source_run_id`:

```sql
select count(1) as row_count
from `creatto-463117.org_3_normalized.clientes`
where source_run_id = 'RUN_ID';
```

## Permission interpretation

- `secretmanager.versions.access denied`: GCP Secret Manager IAM issue.
- `bigquery.tables.update denied` on `org_3_analytics`: analytics/view permission issue. Raw and normalized may still be valid.
- Missing service account JSON or access token locally: use local Windows `gcloud auth print-access-token` when available.

Do not print service account keys, OAuth tokens or database URLs.
