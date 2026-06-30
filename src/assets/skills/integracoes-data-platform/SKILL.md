---
name: integracoes-data-platform
description: "Use when Codex needs to build, operate, test, or diagnose this repo's integrations data platform: Cloud Run sync workers, chunked sync, checkpoints, Pub/Sub, BigQuery raw/normalized datasets, Conta Azul sync, sync runs/events, live CLI smoke tests, and Fivetran-grade reliability work."
---

# Integrações Data Platform

## Core workflow

Use this skill for data sync and data warehouse work in `src/products/integracoes`.

Start from these rules:

- Prefer chunked sync with per-run/per-resource checkpoints for large or unstable resources.
- Treat raw as append-only and normalized as the user-facing analytical layer.
- Do not expose checkpoint internals to end users; show operational progress instead.
- Use CLI for live checks when requested; avoid plugin/tool indirection unless the user asks for it.
- Never print OAuth tokens, refresh tokens, Secret Manager payloads, service account JSON, database URLs or authorization headers.
- Treat analytics/views as auxiliary unless the task explicitly asks for that layer.

## Where to inspect

- Sync workers and jobs: `src/products/integracoes/cloud/src/worker/`
- Chunk engine: `src/products/integracoes/cloud/src/sync-engine/`
- Connector contracts: `src/products/integracoes/connectors/base/`
- Conta Azul connector: `src/products/integracoes/connectors/erp/contaAzul/`
- BigQuery raw/normalized writers: `src/products/integracoes/datawarehouse/`
- Runs, events and cursors: `src/products/integracoes/cloud/src/lib/postgresStatus.ts`
- UI sync progress: `src/products/integracoes/frontend/features/connections/`

## Operational rules

- Validate syncs by `runId` in Postgres and BigQuery.
- For checkpoint tests, use a small resource with low `pageSize` and repeat the same `runId` without passing cursor.
- Isolate Pub/Sub during local checkpoint tests by using a temporary topic without a production push subscription.
- Prefer local Windows `gcloud` when WSL temp config is missing credentials.
- Do not ask users to reconnect a provider for GCP, BigQuery, Secret Manager or network failures.

## References

- Read [references/sync-engine.md](references/sync-engine.md) for chunking, checkpoints, retries, Pub/Sub and stuck runs.
- Read [references/bigquery.md](references/bigquery.md) for datasets, raw/normalized semantics and validation queries.
- Read [references/conta-azul.md](references/conta-azul.md) for the tested Conta Azul development connection and provider notes.
- Read [references/testing.md](references/testing.md) for live smoke and checkpoint test commands.
- Read [references/fivetran-grade-checklist.md](references/fivetran-grade-checklist.md) when planning reliability/product maturity work.
