# Claude Plugin — Cognito ERP

Produto `claudeplugin`, versão **1.0.0**. Servidor MCP remoto que leva o Cognito ERP para o Claude (claude.ai, desktop, celular, Cowork e Claude Code) como **conector**. Consultas, escritas em duas etapas, auditoria e cards vêm do núcleo [`mcpcore`](../mcpcore/README.md); aqui fica só o que é do Claude. Plano e andamento: [`docs/claudeplugin/plano-claudeplugin-20261007.md`](../../../docs/claudeplugin/plano-claudeplugin-20261007.md).

| Pasta | Responsabilidade |
| --- | --- |
| `mcp` | Servidor (`createClaudeServer`), instruções, recurso dos cards com `ui.domain` e handler HTTP sem sessão |
| `auth` | Metadados do recurso protegido (RFC 9728) |
| `shared` | `getClaudePluginConfig()` (`integration: 'claude'`) e versão |

## Endpoint

- MCP: `POST ${CLAUDEPLUGIN_BASE_URL}/api/claude/mcp` (Streamable HTTP, sem sessão, versões estáveis negociadas pelo SDK).
- Metadados: `/.well-known/oauth-protected-resource/api/claude/mcp`.
- Sem token: `401` com `WWW-Authenticate: Bearer resource_metadata=…, scope="erp:read"` antes de o SDK rodar (é o que inicia o login no Claude).

## Tools (35)

As 16 consultas e as 22 escritas do núcleo, com os mesmos nomes do ChatGPT. Diferenças:

- **Anotações:** consultas com `readOnlyHint: true`; **todas** as escritas com `destructiveHint: true` (exigência do Claude para qualquer tool que altera dados — o Claude pede permissão a cada chamada), `idempotentHint: true`, `openWorldHint: false`.
- **Sem** `abrir_painel`, `ler_configuracoes`, `atualizar_configuracoes`, `search_mentions`, `openai/profile`, `securitySchemes` e formulário nativo MRTR. Quando faltam dados, a tool devolve `campos` e o Claude pergunta na conversa.

## Cards

Recurso `ui://claudeplugin/cards/v1.html` (mesmo HTML do núcleo), ligado por `_meta.ui.resourceUri` às 38 tools, com `_meta.ui.domain = sha256(URL do servidor)[0..32].claudemcpcontent.com`, `prefersBorder` e CSP sem destinos externos. O card recebe `host: 'claude'` e segue as regras de UI do Claude: inline com poucos dados (lista de 3 itens em duas linhas, detalhes com até 5 campos, prévia com o essencial), no máximo 2 ações, sem listas suspensas e sem navegação; filtros (botões de escolha), detalhes completos, ajuste de itens e "Voltar" ficam em tela cheia. Botões com 44 px e margens de `safeAreaInsets`.

## Autenticação

Mesmo verificador do núcleo (JWT `at+jwt` do Clerk, `iss`, `aud` = URL do conector, introspecção). `CLAUDEPLUGIN_OAUTH_CLIENT_IDS` aceita `*` para registro dinâmico (DCR), em que cada conexão recebe um `client_id` novo; o rascunho continua preso ao `client_id` que o criou. No Clerk: redirect `https://claude.ai/api/mcp/auth_callback` e loopback (`http://localhost/callback`, `http://127.0.0.1/callback`, qualquer porta) para o Claude Code.

Variáveis: `CLAUDEPLUGIN_BASE_URL`, `CLAUDEPLUGIN_OAUTH_ISSUER`, `CLAUDEPLUGIN_OAUTH_CLIENT_IDS`, `CLAUDEPLUGIN_ALLOWED_ORIGINS` (além de `CLERK_SECRET_KEY` e `SUPABASE_DB_URL`).

## Persistência

Schema `plugin` com `integration='claude'`: rascunhos, execuções, limites (60 por minuto) e preferências separados do ChatGPT. A manutenção (`/api/chatgptplugin/internal/maintenance`) cuida das duas integrações.

## Validação

```text
pnpm claudeplugin:typecheck
pnpm claudeplugin:smoke
pnpm claudeplugin:cards-smoke
pnpm claudeplugin:package-smoke
pnpm chatgptplugin:database-smoke   # inclui o fluxo do Claude com os repositórios reais
```

Rodam localmente, sem Clerk, Supabase ou Claude reais: o smoke usa também o cliente MCP oficial do SDK; os cards rodam em navegador com host simulado (capturas em `.cache/claudeplugin-cards`). Teste no Claude real: [`docs/claudeplugin/teste-claude-real.md`](../../../docs/claudeplugin/teste-claude-real.md).

## Pacote do plugin

```text
pnpm claudeplugin:package --url https://DOMINIO_REAL
```

`plugin/` tem o manifesto (`.claude-plugin/plugin.json`), o README do plugin e as skills `usar-erp` e `get-started`. O script gera `dist/claudeplugin/` e `dist/claudeplugin.zip` (manifesto na raiz, pronto para Customize → Plugins → Upload) com o `.mcp.json` apontando para `https://DOMINIO_REAL/api/claude/mcp`. Antes de publicar: licença definitiva (hoje `UNLICENSED`), páginas públicas de documentação, privacidade, termos e suporte.
