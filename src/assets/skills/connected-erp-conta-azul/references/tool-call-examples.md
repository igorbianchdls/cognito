# Connected ERP Conta Azul tool-call examples

Use these commands from the repository root.

## Create supplier dry-run

Dry-run validates connection, permission and payload without sending a write to Conta Azul.

```bash
node scripts/plugin/tool-call.mjs \
  --tenant <TENANT_ID> \
  --tool connected_erp_api \
  --provider conta_azul \
  --action criar \
  --resource fornecedores \
  --payload-json '{"nome":"Fornecedor Teste","tipo_pessoa":"Jurídica","email":"fornecedor@example.com","telefone":"11999999999","documento":"12345678000195"}' \
  --allow-error
```

## Create supplier real write

Use only after explicit user confirmation.

```bash
node scripts/plugin/tool-call.mjs \
  --tenant <TENANT_ID> \
  --tool connected_erp_api \
  --provider conta_azul \
  --action criar \
  --resource fornecedores \
  --payload-json '{"nome":"Fornecedor Teste","tipo_pessoa":"Jurídica","email":"fornecedor@example.com","telefone":"11999999999","documento":"12345678000195"}' \
  --execute \
  --confirm \
  --allow-error
```

## Create customer dry-run

```bash
node scripts/plugin/tool-call.mjs \
  --tenant <TENANT_ID> \
  --tool connected_erp_api \
  --provider conta_azul \
  --action criar \
  --resource clientes \
  --payload-json '{"nome":"Cliente Teste","tipo_pessoa":"Jurídica","email":"cliente@example.com","telefone":"11988888888","documento":"12345678000195"}' \
  --allow-error
```

## Create customer real write

Use only after explicit user confirmation.

```bash
node scripts/plugin/tool-call.mjs \
  --tenant <TENANT_ID> \
  --tool connected_erp_api \
  --provider conta_azul \
  --action criar \
  --resource clientes \
  --payload-json '{"nome":"Cliente Teste","tipo_pessoa":"Jurídica","email":"cliente@example.com","telefone":"11988888888","documento":"12345678000195"}' \
  --execute \
  --confirm \
  --allow-error
```

## GET customer by provider ID

```bash
node scripts/plugin/tool-call.mjs \
  --tenant <TENANT_ID> \
  --tool connected_erp_api \
  --provider conta_azul \
  --action ler \
  --resource clientes \
  --id <CONTA_AZUL_CLIENTE_ID> \
  --include-provider-fields \
  --allow-error
```

## List customers live

```bash
node scripts/plugin/tool-call.mjs \
  --tenant <TENANT_ID> \
  --tool connected_erp_api \
  --provider conta_azul \
  --action listar \
  --resource clientes \
  --limit 10 \
  --include-provider-fields \
  --allow-error
```

## List customers live with filters

Use API live reads when the user needs the current provider state, not the last synced snapshot.

```bash
node scripts/plugin/tool-call.mjs \
  --tenant <TENANT_ID> \
  --tool connected_erp_api \
  --provider conta_azul \
  --action listar \
  --resource clientes \
  --limit 10 \
  --params-json '{"q":"teste","sort_by":"nome","sort_dir":"asc"}' \
  --include-provider-fields \
  --allow-error
```

Common live-read filters:

- `q`, `search` or `query` for text search.
- `status` or `situacao`.
- `de`/`date_from` and `ate`/`date_to`, with optional `date_field`.
- `valor_min`, `valor_max`.
- `external_id`, `cliente_id`, `fornecedor_id`, `produto_id`, `categoria_id`, `centro_custo_id`, `vendedor_id`, `conta_financeira_id`, `documento`, `numero`.
- `sort_by`, `sort_dir`.

These filters are applied by the adapter when the provider endpoint does not expose an equivalent query parameter.

## Read synced customers from BigQuery

Use BigQuery for dashboards, historical reports and analytical questions. These reads do not call Conta Azul.

```bash
node scripts/plugin/tool-call.mjs \
  --tenant <TENANT_ID> \
  --tool connected_erp_bigquery \
  --provider conta_azul \
  --action listar \
  --resource clientes \
  --limit 10 \
  --params-json '{"q":"teste","sort_by":"nome","sort_dir":"asc"}' \
  --allow-error
```

## Aggregate receivables by status from BigQuery

```bash
node scripts/plugin/tool-call.mjs \
  --tenant <TENANT_ID> \
  --tool connected_erp_bigquery \
  --provider conta_azul \
  --action listar \
  --resource contas-a-receber \
  --limit 20 \
  --params-json '{"mode":"aggregate","metric":"sum","group_by":"status"}' \
  --allow-error
```

Expected aggregate rows use metric aliases such as `sum_valor`, `sum_valor_total`, `count`, `avg_valor`, depending on `metric` and `value_field`.

## Aggregate sales by month from BigQuery

```bash
node scripts/plugin/tool-call.mjs \
  --tenant <TENANT_ID> \
  --tool connected_erp_bigquery \
  --provider conta_azul \
  --action listar \
  --resource pedidos-venda \
  --limit 24 \
  --params-json '{"mode":"aggregate","metric":"sum","value_field":"valor_total","granularity":"month","date_from":"2026-01-01","date_to":"2026-12-31"}' \
  --allow-error
```

Use `granularity=day|week|month|year` for date buckets. Use `date_field` only when the default resource date field is not the desired one.

## BigQuery environment checks

Before diagnosing query logic, confirm the environment has BigQuery credentials. Do not print secret values.

```bash
node -e "const fs=require('fs'),dotenv=require('dotenv'); const p=dotenv.parse(fs.readFileSync('/tmp/cognito-vercel-preview.env','utf8')); for (const k of ['BIGQUERY_CREDENTIALS_JSON','GOOGLE_APPLICATION_CREDENTIALS_JSON','GOOGLE_PROJECT_ID','BIGQUERY_PROJECT_ID']) console.log(k, Boolean(p[k]), p[k]?.length||0)"
```

In the tested development environment:

- Preview/development env had `BIGQUERY_CREDENTIALS_JSON` and `GOOGLE_APPLICATION_CREDENTIALS_JSON` populated.
- Production env had those keys present but empty. BigQuery reads failed locally with default-credential errors in that case.

If local ADC is required:

```bash
cmd.exe /c gcloud auth application-default print-access-token
```

If ADC is missing, either use a service account env var or set up application-default credentials. Do not paste service account JSON or tokens into the chat.

## Create cost center dry-run

```bash
node scripts/plugin/tool-call.mjs \
  --tenant <TENANT_ID> \
  --tool connected_erp_api \
  --provider conta_azul \
  --action criar \
  --resource centros-custo \
  --payload-json '{"nome":"Centro de Custo Teste"}' \
  --allow-error
```

## Create account payable dry-run

Use real provider IDs for `fornecedor_id` and, when used, `centro_custo_id`, `categoria_id` or `conta_financeira_id`.

```bash
node scripts/plugin/tool-call.mjs \
  --tenant <TENANT_ID> \
  --tool connected_erp_api \
  --provider conta_azul \
  --action criar \
  --resource contas-a-pagar \
  --payload-json '{"fornecedor_id":"<CONTA_AZUL_FORNECEDOR_ID>","valor":123.45,"data_vencimento":"2026-07-10","descricao":"Conta a pagar teste"}' \
  --allow-error
```

## Create sale dry-run

Use a real Conta Azul customer ID for `cliente_id`.

```bash
node scripts/plugin/tool-call.mjs \
  --tenant <TENANT_ID> \
  --tool connected_erp_api \
  --provider conta_azul \
  --action criar \
  --resource pedidos-venda \
  --payload-json '{"cliente_id":"<CONTA_AZUL_CLIENTE_ID>","data_venda":"2026-07-10","observacao":"Venda teste","itens":[{"descricao":"Item teste","quantidade":1,"valor_unitario":100}]}' \
  --allow-error
```

## Create product dry-run

`codigo_sku` must have at most 20 characters.

```bash
node scripts/plugin/tool-call.mjs \
  --tenant <TENANT_ID> \
  --tool connected_erp_api \
  --provider conta_azul \
  --action criar \
  --resource produtos \
  --payload-json '{"nome":"Produto Teste","codigo":"PRODTESTE001","valor_venda":123.45,"estoque_disponivel":0,"descricao":"Produto temporario de teste"}' \
  --allow-error
```

## Create product real write

Use only after explicit user confirmation.

```bash
node scripts/plugin/tool-call.mjs \
  --tenant <TENANT_ID> \
  --tool connected_erp_api \
  --provider conta_azul \
  --action criar \
  --resource produtos \
  --payload-json '{"nome":"Produto Teste","codigo":"PRODTESTE001","valor_venda":123.45,"estoque_disponivel":0,"descricao":"Produto temporario de teste"}' \
  --execute \
  --confirm \
  --allow-error
```

## Update product real write

Use only after explicit user confirmation.

```bash
node scripts/plugin/tool-call.mjs \
  --tenant <TENANT_ID> \
  --tool connected_erp_api \
  --provider conta_azul \
  --action atualizar \
  --resource produtos \
  --id <CONTA_AZUL_PRODUTO_ID> \
  --payload-json '{"nome":"Produto Teste Atualizado","codigo":"PRODTESTE001","valor_venda":150.00}' \
  --execute \
  --confirm \
  --allow-error
```

## Delete product real write

Use only after explicit user confirmation and only when the connection permissions include destructive access to `produtos`.

```bash
node scripts/plugin/tool-call.mjs \
  --tenant <TENANT_ID> \
  --tool connected_erp_api \
  --provider conta_azul \
  --action deletar \
  --resource produtos \
  --id <CONTA_AZUL_PRODUTO_ID> \
  --execute \
  --confirm \
  --allow-error
```

## List products live

```bash
node scripts/plugin/tool-call.mjs \
  --tenant <TENANT_ID> \
  --tool connected_erp_api \
  --provider conta_azul \
  --action listar \
  --resource produtos \
  --limit 10 \
  --include-provider-fields \
  --allow-error
```

## Diagnose Conta Azul OAuth

This is read-only. It masks tokens and tests the current access token and refresh token.

```bash
node scripts/integracoes/diagnose-conta-azul-oauth.mjs \
  --tenant <TENANT_ID> \
  --connection <CONNECTION_ID>
```

Use `--skip-refresh` when you only want to test the saved access token.

## Diagnose common failures

Interpret failures by subsystem before asking the customer to reconnect:

| Error text | Meaning | Next action |
| --- | --- | --- |
| `Permission 'secretmanager.versions.access' denied` | Service account cannot read Secret Manager credentials. | Fix GCP IAM for the service account used by this environment. |
| `Could not load the default credentials` | BigQuery client has no usable service account/ADC. | Check `BIGQUERY_CREDENTIALS_JSON`, `GOOGLE_APPLICATION_CREDENTIALS_JSON`, `GOOGLE_APPLICATION_CREDENTIALS` or ADC. |
| `Unable to detect a Project Id` | BigQuery project/env credentials incomplete. | Set `GOOGLE_PROJECT_ID`, `BIGQUERY_PROJECT_ID` or service account JSON with `project_id`. |
| `MCP nao tem permissao de leitura para vendas` | Connection/plugin read permissions do not include the provider resource. | Update plugin permissions/configuration for that connection. |
| `fetch failed`, `EAI_AGAIN`, `ECONNRESET`, timeout | Network/DNS/provider runtime issue. | Retry, test host connectivity, inspect `cause.code`; do not assume OAuth. |
| Conta Azul HTTP `401`/`403` after refresh | Provider authorization is invalid/refused. | Run OAuth diagnostic; reconnect only if provider auth is confirmed invalid. |

For API reads/actions, Secret Manager access is required because credentials are loaded from the connection. BigQuery reads can work without Secret Manager if the normalized tables and BigQuery credentials are available.

## Validated development case

Use these only when the user explicitly asks to operate on the tested development tenant:

- Tenant: `3`
- Conta Azul connection: `2`

Do not assume old test records still exist. Prefer live listing first, then operate on IDs returned by the provider.

Validated live product listing:

```bash
node scripts/plugin/tool-call.mjs \
  --tenant 3 \
  --tool connected_erp_api \
  --provider conta_azul \
  --action listar \
  --resource produtos \
  --limit 10 \
  --include-provider-fields \
  --allow-error
```

Validated BigQuery reads with preview env:

```bash
node scripts/plugin/tool-call.mjs \
  --tenant 3 \
  --tool connected_erp_bigquery \
  --provider conta_azul \
  --action listar \
  --resource clientes \
  --limit 10 \
  --params-json '{"q":"teste"}' \
  --allow-error
```

Validated BigQuery aggregate:

```bash
node scripts/plugin/tool-call.mjs \
  --tenant 3 \
  --tool connected_erp_bigquery \
  --provider conta_azul \
  --action listar \
  --resource contas-a-receber \
  --limit 20 \
  --params-json '{"mode":"aggregate","metric":"sum","group_by":"status"}' \
  --allow-error
```
