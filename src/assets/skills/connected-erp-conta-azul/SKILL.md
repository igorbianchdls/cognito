---
name: connected-erp-conta-azul
description: "Use when Codex needs to operate Conta Azul through this repo's Connected ERP tools: create, update, delete, cancel or settle supported ERP records with connected_erp_api, perform live API reads with connected_erp_api, read normalized BigQuery data with connected_erp_bigquery, diagnose OAuth/Secret Manager issues, or safely test ERP actions from the CLI."
---

# Connected ERP Conta Azul

## Core workflow

Use the project CLI wrapper:

```bash
node scripts/plugin/tool-call.mjs --tenant <tenant_id> --tool <tool> ...
```

Choose the tool by source of truth:

- Use `connected_erp_api` when the user needs current live provider state or wants to change Conta Azul:
  - read live: `listar`, `ler`
  - write actions: `criar`, `atualizar`, `baixar`, `cancelar`, `deletar` only when the provider/resource supports the action.
- Use `connected_erp_bigquery` when the user asks analytical questions, dashboards, historical reports, totals, trends or anything that should read normalized synced data.
- `connected_erp` and `connected_erp_actions` are compatibility aliases. Prefer the split tools above for new work.

Always start write operations as dry-run by omitting `--execute --confirm`. Execute real writes only after explicit user confirmation.

## Read and analytics parameters

For `connected_erp_api` live reads, pass filters in `--params-json` or `--filters-json`. Supported generic filters include `q/search`, `status/situacao`, `de/date_from`, `ate/date_to`, `date_field/data_campo`, `valor_min`, `valor_max`, `sort_by`, `sort_dir`, `external_id`, `cliente_id`, `fornecedor_id`, `produto_id`, `categoria_id`, `centro_custo_id`, `vendedor_id`, `conta_financeira_id`, `documento` and `numero`.

For `connected_erp_bigquery`, use the same filters plus analytical mode:

- `mode=aggregate` for grouped metrics.
- `metric=count|sum|avg|min|max`.
- `value_field` for the numeric column, for example `valor`, `valor_total` or `quantidade`.
- `group_by` for a normalized column such as `status`, `cliente_id` or `categoria_id`.
- `granularity=day|week|month|year` for date grouping using the resource date field.

BigQuery reads depend on the latest sync. Prefer BigQuery for dashboards and questions like “quanto vendi por mês?”; prefer API for “crie”, “atualize”, “leia este registro agora” or when the user expects provider-current data before the next sync.

## Safety rules

- Treat `connected_erp_api --execute --confirm` as a real external write in the customer's ERP.
- Never print OAuth tokens, Secret Manager payloads, service account JSON, or raw secrets.
- Use `--allow-error` for diagnosis so the CLI returns structured failure output.
- Use `--include-provider-fields` for debugging live reads when provider-specific fields matter.
- If OAuth or Secret Manager fails, run the diagnostic script before changing code.
- If the local environment needs GCP access, use the local `gcloud` CLI. In this repo the tool-call script can use Windows gcloud through `cmd.exe /c gcloud auth print-access-token`.
- Do not tell the customer to reconnect Conta Azul for GCP, BigQuery, Secret Manager, local credential or network errors. Request reconnection only for real provider OAuth errors such as invalid/expired/refused provider tokens.

## Conta Azul resources verified

The current implementation has been validated for:

- `clientes/criar`
- `clientes/ler_live`
- `clientes/listar` via BigQuery with `q`
- `fornecedores/criar`
- `centros-custo/criar`
- `contas-a-pagar/criar`
- `contas-a-receber/listar` via BigQuery with `mode=aggregate`
- `pedidos-venda/criar`
- `produtos/criar`
- `produtos/atualizar`
- `produtos/deletar`
- `produtos/listar_live`

The action adapter supports more resources, but verify with dry-run or read-only calls before using real writes.

## Conta Azul resource notes

- `produtos` uses the current Conta Azul Inventory API:
  - create: `POST /v1/produto`
  - update: `PATCH /v1/produtos/{id}`
  - delete: `DELETE /v1/produto/{id}`
  - live list: `GET /v1/produto/busca`
- Product create requires `nome`, `formato`, `estoque` and `dimensao` at the provider payload level. The adapter supplies defaults for `formato`, `estoque` and `dimensao` when the caller provides simple fields.
- Product `codigo_sku` must have at most 20 characters.
- `categorias`, `categorias-dre`, `contas-financeiras` and related lookup resources should be treated as read/live-read unless the provider adapter explicitly supports writes.
- Conta Azul does not support every action on every resource. Use dry-run first and rely on the adapter's structured error when an action is unsupported.

## Diagnostic interpretation

- `Permission 'secretmanager.versions.access' denied`: GCP IAM/Secret Manager permission problem for the service account. Do not ask the customer to reconnect Conta Azul.
- `Could not load the default credentials` or `Unable to detect a Project Id`: local/edge BigQuery credentials are missing or empty. Check Vercel/env/ADC/service account config.
- `MCP nao esta habilitado para a conexao <name>`: plugin/IA access is disabled for the connection. Enable the connection-level permission; grants are no longer managed per resource.
- `fetch failed`, `EAI_AGAIN`, `ECONNRESET` or timeout: provider/network/DNS/runtime connectivity problem. Retry and inspect the underlying cause before changing OAuth code.
- HTTP 401/403 from Conta Azul after token refresh attempts: provider authorization problem; diagnose OAuth and request reconnection only if provider auth is actually invalid.

## Examples

For copy-ready commands, read [references/tool-call-examples.md](references/tool-call-examples.md).

Use placeholders by default. Only use the tenant 3 example IDs when the user specifically asks to work with the already-tested development connection.
