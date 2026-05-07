# Claude MCP Setup

Endpoint de producao:

```txt
https://cognito-seven.vercel.app/api/mcp
```

Autenticacao:

```txt
Authorization: Bearer <COGNITO_MCP_TOKEN>
```

## Variaveis de ambiente

Configure na Vercel:

```txt
COGNITO_MCP_TOKEN=<token-longo>
COGNITO_BASE_URL=https://cognito-seven.vercel.app
```

`COGNITO_BASE_URL` e usado para retornar URLs completas como:

```txt
https://cognito-seven.vercel.app/artifacts/dashboards/:id
```

## Smoke test

Teste o endpoint antes de conectar no Claude:

```bash
COGNITO_MCP_TOKEN=<token-longo> pnpm mcp:smoke
```

Para testar outro endpoint:

```bash
COGNITO_MCP_URL=http://localhost:3000/api/mcp COGNITO_MCP_TOKEN=<token-longo> pnpm mcp:smoke
```

O smoke test valida:

- `initialize`
- `tools/list`
- `tools/call` com `dashboard_get_contract`

Ele nao cria dashboard.

## Configuracao no Claude

Use o servidor remoto com headers de autenticacao:

```json
{
  "mcpServers": {
    "cognito": {
      "url": "https://cognito-seven.vercel.app/api/mcp",
      "headers": {
        "Authorization": "Bearer <COGNITO_MCP_TOKEN>"
      }
    }
  }
}
```

Depois de conectar, o Claude deve enxergar estas tools:

```txt
dashboard_list
dashboard_read
dashboard_create
dashboard_patch
dashboard_update_full
dashboard_get_contract
```

## Fluxo esperado

Criacao:

```txt
dashboard_get_contract -> dashboard_create -> responder artifact_id/version/url
```

Edicao:

```txt
dashboard_read -> dashboard_patch ou dashboard_update_full -> responder nova version/url
```

Regra critica: em edicoes, o Claude deve usar `current_draft_version` como `expected_version`.

