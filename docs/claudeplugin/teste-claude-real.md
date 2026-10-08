# Roteiro de teste no Claude real — Cognito ERP

Complementa os testes locais (`claudeplugin:smoke`, `claudeplugin:cards-smoke`, `claudeplugin:package-smoke` e a verificação "Claude prepara e confirma…" em `chatgptplugin:database-smoke`). Nada deste roteiro roda sem as ações marcadas como **você**.

## 1. Pré-requisitos (você)

1. **Domínio público HTTPS** com o deploy atual. A URL do conector é `https://DOMINIO/api/claude/mcp` e não deve mudar depois (o `ui.domain` dos cards e o `aud` do token dependem dela).
2. **Clerk** (mesma instância do ERP):
   - OAuth Applications com **Dynamic Client Registration** ligado (ou CIMD com `client_id_metadata_document_supported: true` e `none` em `token_endpoint_auth_methods_supported`).
   - Redirects: `https://claude.ai/api/mcp/auth_callback`, `http://localhost/callback` e `http://127.0.0.1/callback` (qualquer porta, para o Claude Code).
   - Access token JWT (`at+jwt`) com o `resource` no `aud` — mesma verificação pendente do ChatGPT.
3. **Variáveis no Vercel:** `CLAUDEPLUGIN_BASE_URL=https://DOMINIO`, `CLAUDEPLUGIN_OAUTH_ISSUER` (Frontend API do Clerk), `CLAUDEPLUGIN_OAUTH_CLIENT_IDS=*` (DCR) ou os `client_id` aceitos.
4. Conta de teste no ERP com dados fictícios, sem 2FA, com uma empresa e perfil administrador.

## 2. Protocolo e login fora do Claude

```bash
curl -i -X POST https://DOMINIO/api/claude/mcp -H "content-type: application/json" -d "{}"
```

Esperado: `401` com `WWW-Authenticate: Bearer resource_metadata="https://DOMINIO/.well-known/oauth-protected-resource/api/claude/mcp"`.

```bash
npx @modelcontextprotocol/inspector
```

No Inspector: transporte Streamable HTTP, URL do conector, fluxo OAuth completo; conferir 35 tools, `tools/call meu_acesso` e `resources/read ui://claudeplugin/cards/v1.html`.

## 3. claude.ai (web e desktop)

1. Settings → Connectors → **Add custom connector** com a URL do conector; entrar com a conta de teste.
2. Cenários (anotar tempo, cliques e o que o Claude responde):

| # | Pedido | Esperado |
| --- | --- | --- |
| 1 | "O que o Cognito ERP faz? Comece." | `meu_acesso` + `resumo_erp`, card de resumo |
| 2 | "Quais contas a pagar vencem esta semana?" | Card com 3 itens, "Ver vencidas"/"Ver tudo"; tela cheia com filtros em botões |
| 3 | Clicar numa linha em tela cheia → "Registrar pagamento" | Prévia com saldo, hoje e conta sugerida; Confirmar salva |
| 4 | "Crie um orçamento para <cliente> com 2 itens" | Permissão do Claude → prévia → Confirmar no card → resultado com próximo passo |
| 5 | "Converta esse orçamento em venda e confirme" | Duas operações, cada uma com prévia |
| 6 | Pedido com dados faltando ("crie um cliente") | O Claude pergunta só o que falta (`campos`) |
| 7 | Venda com 6+ itens | Prévia resumida inline + "Ver prévia completa" |
| 8 | Tema escuro e janela estreita | Cards legíveis, sem rolagem horizontal |

3. **Etapa 3 (confirmação dupla):** observar em 4 e 5 quantas vezes o usuário confirma (permissão do Claude + Confirmar do card; "Sempre permitir" muda isso?). Decidir se mantém ou simplifica.

## 4. Celular

Mesmos cenários 2, 3 e 4 no app do Claude: margens (`safeAreaInsets`), botões de 44 px, tela cheia.

## 5. Claude Code

```bash
claude mcp add --transport http cognito-erp https://DOMINIO/api/claude/mcp
```

`/mcp` para autenticar (loopback). Cenários 1, 2 e 4 em texto.

## 6. Plugin

```bash
pnpm claudeplugin:package --url https://DOMINIO
claude plugin validate dist/claudeplugin
claude --plugin-dir dist/claudeplugin
```

No claude.ai: Customize → Plugins → Add → **Upload plugin** com `dist/claudeplugin.zip`; perguntar "quais skills você tem de plugins?" e conectar o conector na aba Connectors do plugin.

## 7. Antes de submeter ao diretório (Etapa 7)

- Licença definitiva no `plugin.json` (hoje `UNLICENSED`) ou arquivo `LICENSE`.
- Páginas públicas: documentação do conector, privacidade, termos e suporte.
- 3–5 capturas (≥ 1000 px) dos cards no Claude.
- Conta de teste para a revisão da Anthropic.
