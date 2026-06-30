# Fivetran-grade Checklist

## Reliability

- Chunk/checkpoint support for priority providers.
- Retry/backoff per chunk for 429, 5xx and timeouts.
- Stuck-run detector and cleanup.
- Idempotent normalized writes or explicit append-only policy.
- Provider-specific rate-limit handling.

## Observability

- UI progress per run/resource.
- Sync history with records, duration, warnings and error summaries.
- Internal dashboard for stuck runs, queue depth, provider error rate and freshness.
- Alerts for OAuth failure, repeated sync failure, stale data and unexpected volume drops.

## Schema management

- Detect schema drift.
- Record new columns and type conflicts.
- Make schema changes visible to operators.
- Keep raw payload available for replay/debug.

## Product UX

- Show progress, not checkpoint internals.
- Keep technical details behind an advanced/debug affordance.
- Use user-facing language for provider auth vs infrastructure failures.
- Provide backfill/reprocess controls by resource and date range.

## Current known gaps

- Analytics/views should not block the main raw/normalized path.
- Not all providers implement `fetchChunk`.
- Retry/backoff and stuck-run automation need hardening.
- Live smoke tests should be standardized per provider.
