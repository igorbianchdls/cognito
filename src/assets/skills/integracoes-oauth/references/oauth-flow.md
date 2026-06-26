# OAuth integration flow reference

## Mental model

The integration OAuth system has three separate responsibilities:

1. Supabase/Postgres stores operational state.
2. GCP Secret Manager stores sensitive credentials.
3. The provider, for example Conta Azul, owns authorization and tokens.

Do not collapse these into one generic “OAuth failed” bucket. A user should reconnect only when the provider authorization is actually invalid or refused.

## Main data stores

Supabase tables:

- `integrations.connections`
  - connection identity and status.
  - key fields: `id`, `tenant_id`, `domain`, `provider`, `status`, `secret_ref`, `selected_resources`, `sync_frequency`, `metadata`, `last_error`.
  - `secret_ref` points to GCP Secret Manager, not to the token itself.
- `integrations.events`
  - audit/timeline for connection changes, OAuth connected/refreshed/failed, sync started/completed/failed.
- `integrations.sync_runs`
  - execution history for manual/scheduled syncs.
- `integrations.plugin_permissions`
  - which resources/tools can read/write/destructively act through MCP/plugin tools.
- `integrations.plugin_action_audit`
  - audit trail for tool actions such as Connected ERP writes.

GCP Secret Manager:

- Stores JSON credential payloads per connection.
- Current connection credential secret naming pattern is effectively tenant/connection scoped.
- Credential JSON commonly contains:
  - `authType: "oauth2"`
  - `accessToken`
  - `refreshToken`
  - `expiresAt`
  - `tokenType`
  - `scope`

## OAuth setup flow

1. User chooses a provider in Integracoes.
2. App/control API creates or updates an `integrations.connections` row.
3. For OAuth providers, setup builds an authorization URL with:
   - `client_id`
   - `redirect_uri`
   - `response_type=code`
   - `state`
   - `scope`
4. `state` contains tenant id, connection id, provider and expiry, signed by server secret.
5. User authorizes in the provider UI.
6. Provider redirects back to the integration callback with `code` and `state`.
7. Callback validates `state`.
8. Callback exchanges `code` for token set.
9. Token set is written to Secret Manager.
10. Supabase connection is updated to `connected`.
11. Event `connection.oauth.connected` is created.
12. Post-auth finalize/provision/sync may run.

## Access token vs refresh token

`accessToken`:

- Used directly in provider API requests.
- Short-lived. Conta Azul commonly returns `expires_in` around `3600` seconds.
- Expiring access tokens are normal.

`refreshToken`:

- Used by the backend to request a new access token.
- Exists to prevent the customer from reauthenticating every hour.
- Must be stored securely and never printed.
- Some providers rotate refresh tokens. When a refresh response includes a new refresh token, save it immediately.

Expected behavior:

1. Backend sees `expiresAt` is near.
2. Backend calls provider token endpoint with `grant_type=refresh_token`.
3. Provider returns new access token and maybe a new refresh token.
4. Backend writes updated credential JSON to Secret Manager.
5. Backend clears auth errors and leaves/sets connection `connected`.

## Refresh-token rotation and concurrency

Refresh must be protected with a per-connection lock.

Why:

- If two workers refresh with the same old refresh token, the first may receive a new refresh token and invalidate the old one.
- The second worker can then receive `invalid_grant`.
- Without protection, the second failure can incorrectly mark the connection as requiring reauth.

Robust pattern:

1. Acquire short lock for `(tenant_id, connection_id)`.
2. If lock cannot be acquired, re-read current secret.
3. If another process already refreshed successfully, use that secret.
4. If lock is acquired, call provider refresh endpoint.
5. Save new credential payload.
6. Clear lock.
7. On failure, re-read secret before marking `pending_auth`.
8. Mark `pending_auth` only if latest secret is still expired and provider returned a real reauth error.

## Error source taxonomy

Use typed/source-aware errors:

- `provider_oauth`
  - token endpoint, code exchange or refresh token endpoint failed.
  - examples: `invalid_grant`, `invalid_token`.
- `provider_api`
  - API request to provider failed after token was obtained.
  - examples: provider returned `401`, `403`, permission denied.
- `gcp_auth`
  - Google auth/service account/metadata token failed.
  - example: `Invalid grant: account not found`.
- `gcp_secret_manager`
  - Secret Manager read/write failed.
  - examples: permission denied, secret not found, GCP API unavailable.
- `gcp_api`
  - BigQuery/provisioning/other GCP API failed.
- `network`
  - DNS, timeout, transient connectivity.
- `internal`
  - parsing, validation or application bug.

Critical rule:

`Invalid grant: account not found` from Google/GCP is not a provider OAuth failure and must not ask the customer to reconnect Conta Azul.

## Status rules

Connection status should mean:

- `connected`: authorization is usable or expected to be refreshable.
- `warning`: usable enough or operational warning exists.
- `error`: sync/data operation failed.
- `pending_auth`: customer action is required to authorize/reconnect provider.

Set `pending_auth` only when:

- provider OAuth refresh/code exchange returns `invalid_grant`, `invalid_token`, or equivalent;
- provider API returns auth failure that cannot be resolved by refresh;
- provider/user revoked consent.

Do not set `pending_auth` for:

- Secret Manager permission errors;
- Google service account errors;
- BigQuery dataset/table errors;
- network timeouts;
- malformed local config unless it directly makes provider OAuth impossible.

## Recommended metadata

Provider auth failure metadata:

- `oauthRefreshFailedAt`
- `oauthRefreshError`
- `lastAuthErrorSource`
- `lastAuthErrorCode`
- `lastAuthErrorMessage`
- `lastAuthErrorHttpStatus`
- `lastAuthErrorRaw`

Infrastructure failure metadata:

- `lastInfraErrorAt`
- `lastInfraErrorSource`
- `lastInfraErrorCode`
- `lastInfraErrorMessage`
- `lastInfraErrorHttpStatus`
- `lastInfraErrorRaw`

Use redacted payloads only. Never store raw secrets in metadata.

## UI messaging

Provider reauth:

- “A autorização expirou ou foi recusada. Abra para reconectar.”
- Show reconnect button.

Infrastructure issue:

- “Falha interna temporária na integração.”
- Do not show reconnect as the primary fix unless there is also a provider auth error.

Data warehouse/provisioning issue:

- “Dados conectados, mas houve falha ao preparar datasets/tabelas.”
- Direct operator to provisioning/BigQuery diagnosis, not reauth.

## Debugging checklist

1. Read `integrations.connections` for the tenant/provider:
   - `status`
   - `secret_ref IS NOT NULL`
   - `metadata`
   - `last_error`
2. Read recent `integrations.events`.
3. Read recent `integrations.sync_runs`.
4. If Secret Manager is involved, confirm GCP auth source and permissions.
5. If provider token refresh failed, capture safe response:
   - HTTP status.
   - provider `error`.
   - provider `error_description`.
6. Check whether error source is provider or infra.
7. Only ask user to reconnect if provider authorization is actually invalid.

## Useful commands

Read-only Supabase investigation:

```bash
node scripts/supabase-crm-get.mjs --sql "SELECT id, tenant_id, domain, provider, status, secret_ref IS NOT NULL AS has_secret, metadata, last_error, updated_at FROM integrations.connections WHERE tenant_id = <TENANT_ID> AND provider = '<PROVIDER>' ORDER BY updated_at DESC LIMIT 5"
```

Conta Azul OAuth diagnostic:

```bash
node scripts/integracoes/diagnose-conta-azul-oauth.mjs --tenant <TENANT_ID> --connection <CONNECTION_ID>
```

Skip refresh when only testing saved access token:

```bash
node scripts/integracoes/diagnose-conta-azul-oauth.mjs --tenant <TENANT_ID> --connection <CONNECTION_ID> --skip-refresh
```

Live read through plugin tool:

```bash
node scripts/plugin/tool-call.mjs \
  --tenant <TENANT_ID> \
  --tool connected_erp \
  --provider conta_azul \
  --action listar_live \
  --resource clientes \
  --limit 10 \
  --include-provider-fields \
  --allow-error
```
