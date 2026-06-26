---
name: integracoes-oauth
description: "Use when Codex needs to understand, diagnose, explain, or modify the integrations OAuth flow in this repo: provider authorization, callbacks, Supabase connection state, Secret Manager credentials, access tokens, refresh tokens, token rotation, sync/live-read behavior, and reauthentication errors."
---

# Integrações OAuth

## Core workflow

Use this skill when working on OAuth-backed integrations such as Conta Azul, Bling, HubSpot, Shopify or similar providers.

Start from these facts:

- Supabase is the operational source of truth for connection state, sync runs, events and plugin permissions.
- GCP Secret Manager stores sensitive credentials/tokens.
- Provider APIs use short-lived `accessToken`.
- `refreshToken` exists so the customer does not need to reauthenticate every hour.
- Only real provider OAuth/auth failures should request customer reauthentication.
- GCP, Secret Manager, BigQuery, network and internal errors must not be reported as “provider authorization expired” unless the provider actually returned an auth failure.

## Where to inspect

- OAuth config, authorization URL, code exchange and refresh: `src/products/integracoes/connectors/oauth/`
- OAuth callback and setup control API: `src/products/integracoes/cloud/src/control-api/routes/`
- Token refresh usage in workers/adapters: `src/products/integracoes/cloud/src/worker/jobs/runSyncJob.ts` and provider API adapters.
- Supabase connection status/events helpers: `src/products/integracoes/cloud/src/lib/postgresStatus.ts` and `src/products/integracoes/server/integrationConnectionRepository.ts`
- Secret Manager/GCP auth: `src/products/integracoes/cloud/src/lib/secretManager.ts` and `src/products/integracoes/cloud/src/lib/googleAuth.ts`
- UI status mapping: `src/products/integracoes/server/integrationStatusMapper.ts`

## Diagnostic rules

- Never print access tokens, refresh tokens, client secrets, authorization headers or Secret Manager payloads.
- Preserve error source and safe provider error payloads when diagnosing.
- Differentiate:
  - `provider_oauth`: token endpoint/code/refresh failure.
  - `provider_api`: provider API returned auth/permission failure.
  - `gcp_auth`: Google credential/token failure.
  - `gcp_secret_manager`: secret read/write failure.
  - `gcp_api`: BigQuery/provisioning/GCP API failure.
  - `network` or `internal`: operational issue.
- Mark `pending_auth` only for provider reauth errors such as `invalid_grant`, `invalid_token`, `401` or `403` from the provider.

## Detailed reference

Read [references/oauth-flow.md](references/oauth-flow.md) when you need the full end-to-end flow, Supabase tables, token lifecycle, refresh-token rotation rules, or recommended debugging checklist.
