# Conta Azul

## Development test target

Use only when the user explicitly asks to work with the tested development connection:

```txt
tenantId: 3
connectionId: 2
provider: conta_azul
project: creatto-463117
```

Do not include credentials in prompts, files or logs.

## Validated sync resource

`clientes` was validated with chunked sync:

- single chunk: `pageSize=500`, 33 records.
- checkpoint test: `pageSize=10`, 4 chunks, 33 records.
- raw table: `org_3_raw.conta_azul_clientes`.
- normalized table: `org_3_normalized.clientes`.

## Conta Azul connector notes

- Chunked sync uses `fetchChunk`.
- Standard paginated resources use page cursors: `{ "page": N }`.
- Derived resources use parent pagination and child fetches.
- SKU fields in write paths must remain short; product `codigo_sku` has provider limits.

## Error interpretation

- Provider API 401/403 after refresh can require provider OAuth diagnosis.
- Secret Manager and BigQuery errors are infrastructure errors, not customer reconnect instructions.
- `fetch failed` can be local credential, network or metadata-server related; inspect source before changing OAuth.
