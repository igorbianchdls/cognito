# AI Platform

Uma unica camada de ferramentas para o CLI interno e para clientes MCP como ChatGPT e Claude.

## CLI

```powershell
pnpm otto tools list
pnpm otto tools describe erp_search_sales
pnpm otto tools call erp_search_sales --user usuario@empresa.com --organization minha-empresa --args-base64 e30=
```

`--args-base64` recebe o JSON codificado em Base64 e evita problemas de aspas no PowerShell. O valor `e30=` representa `{}`.

O CLI nunca aceita `tenant_id`: a empresa e resolvida pela associacao ativa entre o usuario e o slug informado. O comando e bloqueado quando `NODE_ENV=production`.

## MCP

Endpoint unico:

```text
/api/ai/mcp
```

O cliente autentica por OAuth do Clerk com `openid` e `user:org:read`. Permissoes funcionais do ERP continuam sendo verificadas no servidor para cada tool.

Tools de escrita ficam desabilitadas por conexao ate serem liberadas em `/configuracoes/integracoes-ia`. Confirmacoes, cancelamentos, baixas e estornos usam duas etapas: `prepare`, aprovacao humana no Otto e `commit`.
