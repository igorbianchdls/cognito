---
name: connected-erp-conta-azul
description: "Use when Codex needs to operate Conta Azul through this repo's Connected ERP tools: create or update ERP records with connected_erp_actions, perform live GET/list reads with connected_erp, diagnose OAuth/Secret Manager issues, or safely test ERP actions from the CLI."
---

# Connected ERP Conta Azul

## Core workflow

Use the project CLI wrapper:

```bash
node scripts/plugin/tool-call.mjs --tenant <tenant_id> --tool <tool> ...
```

Prefer these tools:

- `connected_erp` for read-only operations: `listar`, `ler`, `listar_live`, `ler_live`.
- `connected_erp_actions` for write operations: `criar`, `atualizar`, `baixar`, `cancelar`, `deletar` when supported by the provider/resource.

Always start write operations as dry-run by omitting `--execute --confirm`. Execute real writes only after explicit user confirmation.

## Safety rules

- Treat `connected_erp_actions --execute --confirm` as a real external write in the customer's ERP.
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

The action adapter supports more resources, but verify with dry-run or read-only calls before using real writes.

## Examples

For copy-ready commands, read [references/tool-call-examples.md](references/tool-call-examples.md).

Use placeholders by default. Only use the tenant 3 example IDs when the user specifically asks to work with the already-tested development connection.
