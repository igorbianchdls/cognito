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

Prefer these tools:

- `connected_erp_api` for Conta Azul API operations:
  - read live: `listar`, `ler`
  - write actions: `criar`, `atualizar`, `baixar`, `cancelar`, `deletar` only when the provider/resource supports the action.
- `connected_erp_bigquery` for normalized read-only data already synced to BigQuery: `listar`, `ler`.
- `connected_erp` and `connected_erp_actions` are compatibility aliases. Prefer the split tools above for new work.

Always start write operations as dry-run by omitting `--execute --confirm`. Execute real writes only after explicit user confirmation.

## Safety rules

- Treat `connected_erp_api --execute --confirm` as a real external write in the customer's ERP.
- Never print OAuth tokens, Secret Manager payloads, service account JSON, or raw secrets.
- Use `--allow-error` for diagnosis so the CLI returns structured failure output.
- Use `--include-provider-fields` for debugging live reads when provider-specific fields matter.
- If OAuth or Secret Manager fails, run the diagnostic script before changing code.
- If the local environment needs GCP access, use the local `gcloud` CLI. In this repo the tool-call script can use Windows gcloud through `cmd.exe /c gcloud auth print-access-token`.

## Conta Azul resources verified

The current implementation has been validated for:

- `clientes/criar`
- `clientes/ler_live`
- `fornecedores/criar`
- `centros-custo/criar`
- `contas-a-pagar/criar`
- `pedidos-venda/criar`
- `produtos/criar`
- `produtos/deletar`
- `produtos/listar_live`

The action adapter supports more resources, but verify with dry-run or read-only calls before using real writes.

## Conta Azul resource notes

- `produtos` uses the current Conta Azul Inventory API:
  - create: `POST /v1/produto`
  - delete: `DELETE /v1/produto/{id}`
  - live list: `GET /v1/produto/busca`
- `produtos/atualizar` is not supported by the current API and must stay blocked unless Conta Azul publishes an update endpoint.
- Product create requires `nome`, `formato`, `estoque` and `dimensao` at the provider payload level. The adapter supplies defaults for `formato`, `estoque` and `dimensao` when the caller provides simple fields.
- Product `codigo_sku` must have at most 20 characters.
- `categorias`, `categorias-dre`, `contas-financeiras` and related lookup resources should be treated as read/live-read unless the provider adapter explicitly supports writes.

## Examples

For copy-ready commands, read [references/tool-call-examples.md](references/tool-call-examples.md).

Use placeholders by default. Only use the tenant 3 example IDs when the user specifically asks to work with the already-tested development connection.
