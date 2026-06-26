# Connected ERP Conta Azul tool-call examples

Use these commands from the repository root.

## Create supplier dry-run

Dry-run validates connection, permission and payload without sending a write to Conta Azul.

```bash
node scripts/plugin/tool-call.mjs \
  --tenant <TENANT_ID> \
  --tool connected_erp_actions \
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
  --tool connected_erp_actions \
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
  --tool connected_erp_actions \
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
  --tool connected_erp_actions \
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
  --tool connected_erp \
  --provider conta_azul \
  --action ler_live \
  --resource clientes \
  --id <CONTA_AZUL_CLIENTE_ID> \
  --include-provider-fields \
  --allow-error
```

## List customers live

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
- Created supplier: `c215a4d0-e640-4a62-9763-211f2d64713b`
- Created customer: `fb059595-fd0e-4341-b736-cdb5a2e93b99`

Validated GET:

```bash
node scripts/plugin/tool-call.mjs \
  --tenant 3 \
  --tool connected_erp \
  --provider conta_azul \
  --action ler_live \
  --resource clientes \
  --id fb059595-fd0e-4341-b736-cdb5a2e93b99 \
  --include-provider-fields \
  --allow-error
```
