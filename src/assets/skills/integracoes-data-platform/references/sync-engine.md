# Sync Engine

## Mental model

The data sync path is:

```txt
connector.fetchChunk -> raw BigQuery -> normalized BigQuery -> checkpoint -> next chunk
```

Use chunked sync for resources that can exceed worker timeout or need resumability.

## Checkpoints

- Store checkpoints in `integrations.sync_cursors`.
- Use `cursor_key = runId` for chunked runs.
- Keep checkpoint state per tenant, connection, resource and run.
- Store accumulated stats under `__syncStats`.
- Strip `__syncStats` before passing cursor to provider APIs.
- Write the next checkpoint only after raw/normalized writes succeed and the next chunk is safely queued.

Expected final cursor:

```json
{
  "done": true,
  "__syncStats": {
    "recordsIn": 33,
    "recordsUpdated": 33,
    "recordsFailed": 0,
    "chunksProcessed": 4
  },
  "completedAt": "..."
}
```

## Pub/Sub

- Default topic: `integrations-sync-requests`.
- Active push subscription: `integrations-sync-worker-push-sub`.
- Worker HTTP endpoint receives Pub/Sub pushes at `/pubsub`.
- For local checkpoint tests, override `PUBSUB_SYNC_TOPIC` to a temporary topic with no production subscription.

## Run lifecycle

- First chunk may omit `runId`; the database creates the bigint run ID.
- Later chunks should use the same `runId`.
- If a later chunk omits cursor, the worker must read the checkpoint for that run/resource.
- Finish the run only when the resource returns `done: true`.

## Failure handling

- Provider/network retryable failures should retry chunk work, not restart the whole run.
- Stuck runs should be marked `error` or `stale` by maintenance tooling.
- Never classify GCP/Secret Manager/BigQuery errors as provider OAuth failures.
