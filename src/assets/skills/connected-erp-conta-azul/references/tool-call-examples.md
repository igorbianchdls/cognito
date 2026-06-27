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

`codigo_sku` must have at most 20 characters. Product update is not supported by the current Conta Azul API.

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
