# Plano — produto `claudeplugin` (Cognito ERP no Claude) — 07/10/2026

Objetivo: levar o mesmo ERP que hoje opera no ChatGPT para o Claude (claude.ai web, desktop, celular, Cowork e Claude Code), com as mesmas consultas, escritas em duas etapas e cards, sem duplicar a lógica de negócio. Nota fiscal, cobrança e bancos continuam fora.

## Como o Claude funciona (o que muda em relação ao ChatGPT)

| Tema | ChatGPT (hoje) | Claude |
| --- | --- | --- |
| Conexão | Servidor MCP remoto | Igual: servidor MCP remoto (Streamable HTTP), visto pelo usuário como **conector** |
| Pacote | Agent Plugin (manifesto + skills + MCP) | **Plugin** `.claude-plugin/plugin.json` + skills + `.mcp.json` apontando para o servidor; skills funcionam em Chat, Cowork e Code |
| OAuth | Clerk, CIMD do ChatGPT | Clerk; o Claude registra-se por **DCR** ou **CIMD** ("identidade publicada do Claude"); callback `https://claude.ai/api/mcp/auth_callback` + loopback para o Claude Code; specs de autorização 2025-03-26, 2025-06-18 e 2025-11-25 |
| Protocolo | Inclui 2026-07-28 (MRTR) | Claude não usa recursos "avançados ou em rascunho" nem sampling; o servidor precisa responder nas versões estáveis (já responde) |
| Formulário nativo | `openai/elicitation` (MRTR) | **Não disponível** → a tool devolve `campos` faltantes e o modelo pergunta na conversa |
| Configurações, menções, perfil | Extensões `openai/settings`, `search_mentions`, `openai/profile` | Não existem → `ler/atualizar_configuracoes` viram tools comuns (ou somem); sem `search_mentions` |
| Anotações | `destructiveHint` só em excluir/cancelar/estornar | **Toda tool que altera dados precisa de `destructiveHint: true`** (o Claude sempre pede permissão); leituras com `readOnlyHint: true`; `title` obrigatório; nome ≤ 64 caracteres |
| Cards | MCP Apps + chaves `openai/*` | MCP Apps padrão (mesmo HTML) + `_meta.ui.domain` = `sha256(URL do servidor)[0..32].claudemcpcontent.com` |
| Regras de UI inline | ≤ 2 ações | ≤ 2 ações, **4–5 dados**, **sem drill-in, menus, popovers ou dropdowns**; carrossel 3–8; tela cheia permite abas/paginação; `safeAreaInsets`, alvos de 44 pt, esqueleto de carregamento |
| Limites | Nosso: 128 KB | Resultado até ~150.000 caracteres; 240 s por chamada (claude.ai/desktop); Claude Code 25.000 tokens |
| Proibido na revisão | — | Ferramentas que **transferem dinheiro**; descrições com instruções ao modelo ("sempre chame…"); erros sem ação sugerida |

Consequência importante: no Claude o usuário verá **duas confirmações** em toda escrita (o prompt de permissão do Claude e o nosso Confirmar no card). O plano trata isso na Etapa 3.

## Arquitetura proposta

Não copiar o `chatgptplugin`. Extrair o núcleo comum e deixar cada produto como um **adaptador fino de host**.

```
src/products/
  erp/                      (inalterado)
  mcpcore/                  (NOVO — núcleo compartilhado, sem nada de OpenAI/Anthropic)
    tools/       catálogo de consultas, outputs/envelopes
    actions/     specs das 20 escritas, contratos, operações, drafts, decideDraft
    application/ executeTool (auditoria, limites, erros com campos)
    auth/        verificação do token Clerk (issuer, audience e clientes por host)
    ui/          cards (ponte MCP Apps, componentes, estilos, telas)
    host.ts      interface HostProfile
  chatgptplugin/            (passa a usar mcpcore; mantém extensões OpenAI)
  claudeplugin/             (NOVO)
    mcp/         createServer + handleRequest com HostProfile 'claude'
    auth/        metadados do recurso protegido do endpoint Claude
    plugin/      .claude-plugin/plugin.json, .mcp.json, skills
    README.md
```

`HostProfile` decide o que hoje está fixo para o ChatGPT:

| Campo | chatgpt | claude |
| --- | --- | --- |
| `integration` (banco `plugin.*`) | `'chatgpt'` | `'claude'` |
| `resource` / audience | `${BASE}/api/mcp` | `${BASE}/api/claude/mcp` |
| clientes OAuth permitidos | `CHATGPTPLUGIN_OAUTH_CLIENT_IDS` | `CLAUDEPLUGIN_OAUTH_CLIENT_IDS` |
| anotação de escrita | destrutiva só nas de risco | `destructiveHint: true` em todas |
| `_meta` dos cards | `openai/*` + `ui.resourceUri` | `ui.resourceUri` + `ui.domain` do Claude |
| extensões | settings, mentions, profile, MRTR | nenhuma |
| regras de UI | atuais | `host: 'claude'` no card (ver Etapa 4) |

O schema `plugin` já tem a coluna `integration`, mas o código grava e filtra `integration='chatgpt'` fixo (`maintenance.ts`, `executionRepository.ts`, `approvalRepository.ts`, `draftRepository.ts`, `rate_windows`, `settings`). Isso vira parâmetro. Rascunho criado por um host **não** pode ser executado pelo outro (já garantido pelo cliente OAuth; passa a ser garantido também por `integration`).

## Etapas

### Etapa 0 — Pré-requisitos (sem código)

1. Clerk: confirmar que aceita DCR **ou** CIMD para o Claude e que grava o `resource` no `aud` (mesmo teste pendente do ChatGPT). Liberar os redirects `https://claude.ai/api/mcp/auth_callback` e `http://localhost:*` (Claude Code).
2. Decidir domínio de produção (o `ui.domain` depende da URL exata do servidor).
3. Conta de demonstração sem 2FA, com dados fictícios, para a revisão da Anthropic.

### Etapa 1 — Extrair `mcpcore` (refatoração sem mudança de comportamento)

1. Mover catálogo, ações, `executeTool`, auditoria, limites, verificação de token e cards para `mcpcore`, recebendo `HostProfile`.
2. Parametrizar `integration` em todas as consultas a `plugin.*`.
3. `chatgptplugin` passa a importar de `mcpcore`.
4. Critério de saída: **todas as suítes atuais do ChatGPT passam sem alteração** (smoke, auth, mrtr, database, cards, interface, package).

### Etapa 2 — Servidor MCP do Claude

1. Rota `/api/claude/mcp` (Streamable HTTP, sem sessão) e `/.well-known/oauth-protected-resource/api/claude/mcp`.
2. Mesmas 15 consultas e 20 escritas, mesmos nomes (todos ≤ 64 caracteres), com `title` em português.
3. Anotações Claude: leituras `readOnlyHint: true`; **todas** as escritas `destructiveHint: true`, `idempotentHint: true`, `openWorldHint: false`.
4. Sem `search_mentions`, `openai/profile` nem MRTR. Quando faltar campo obrigatório: `VALIDATION_ERROR` com `campos` e mensagem acionável ("Informe o cliente; use buscar_cadastros para achar o ID").
5. `ler_configuracoes`/`atualizar_configuracoes`: manter como tools comuns (preferências por usuário em `plugin.settings` com `integration='claude'`) ou remover — decisão abaixo.
6. Revisar descrições: tirar qualquer frase imperativa ao modelo que a revisão possa ler como injeção ("sempre", "nunca chame…"); deixar regras de uso nas **skills** e nas `instructions` do servidor.
7. `registrar_baixa` e `estornar_pagamento`: descrição deixa claro que **registram** um pagamento já feito fora do sistema, não movimentam dinheiro (evita a regra de "transferência de dinheiro").

### Etapa 3 — Confirmação em duas etapas no Claude

Problema: o Claude pede permissão em toda tool destrutiva, então a prévia (que não altera nada) também pediria permissão, e a execução pediria de novo.

Proposta:

- **Prévia vira tool própria só de leitura?** Não: mudaria os 20 nomes. Em vez disso, cada escrita continua com duas etapas, e o usuário aprova a chamada pelo prompt do Claude ("Sempre permitir" resolve para quem confia).
- O botão **Confirmar** do card chama a execução via `tools/call` da ponte MCP Apps; chamadas iniciadas pelo app passam pela política do host — validar no Claude real se o prompt aparece de novo.
- Alternativa se a dupla confirmação incomodar: no perfil Claude, a prévia já mostra o card e o texto pede "Confirme no card"; a execução só aceita `rascunho_id` (já é assim), então nada muda no ERP sem o clique.

Decisão final depende do teste no Claude real (Etapa 6).

### Etapa 4 — Cards no Claude

Mesmo recurso HTML, com ajustes quando `host === 'claude'` (detectado por `hostContext` / perfil do servidor):

| Card | Ajuste |
| --- | --- |
| Todos | `_meta.ui.domain`; `prefersBorder`; respeitar `safeAreaInsets`; botões ≥ 44 px; esqueleto (já existe) |
| Lista inline | no máximo 4–5 dados por linha; sem clique na linha (drill-in é proibido inline) → a linha abre detalhes só em tela cheia |
| Filtros | hoje usam `<select>` → em tela cheia trocar por botões segmentados (situação, período, ordem); inline sem filtros |
| Detalhes | inline: até 5 campos + 2 ações; resto em tela cheia (já é quase assim, hoje mostra 8) |
| Escolha de cadastro | 2–8 opções como carrossel/lista de cartões com "Usar este" (encaixa na regra 3–8) |
| Revisão | Confirmar + Ajustar (2 ações); "Ajustar" com campos só em tela cheia |
| Painel (`abrir_painel`) | tela cheia com abas (permitido) |

A ponte (`ui/bridge/mcpApps.ts`) já usa o padrão MCP Apps (`ui/initialize`, `tools/call`, `ui/message`, `ui/update-model-context`, `ui/request-display-mode`); conferir quais o Claude implementa e ter fallback para `ui/message` quando `tools/call` não estiver disponível.

### Etapa 5 — Plugin, skills e documentação

1. `src/products/claudeplugin/plugin/.claude-plugin/plugin.json` (nome `cognito-erp`, versão, descrição, autor, homepage) + `.mcp.json` com a URL remota.
2. Skills reaproveitadas de `usar-erp` e `get-started`, reescritas para o Claude: fluxo prévia → confirmar, como achar IDs, quando usar tela cheia, linguagem de PME brasileira.
3. Script `claudeplugin:package` que gera `dist/claudeplugin/` e valida a estrutura.
4. Página pública de documentação do conector, política de privacidade, termos e suporte (exigidos na submissão).

### Etapa 6 — Testes

1. **Locais** (espelhando o ChatGPT): `claudeplugin:smoke` (lista de tools, anotações Claude — toda escrita destrutiva —, `title`, nomes ≤ 64, sem extensões OpenAI), `claudeplugin:auth-smoke` (audience do endpoint Claude, cliente DCR/CIMD, recusa de token do ChatGPT), `claudeplugin:database-smoke` (drafts com `integration='claude'`, rascunho de um host não executa no outro), `claudeplugin:cards-smoke` (host simulado Claude: sem `<select>` inline, ≤ 5 dados, `safeAreaInsets`, `ui.domain`).
2. **MCP Inspector** contra o endpoint local com túnel.
3. **Claude real** como conector personalizado (Settings → Connectors → Add custom connector): login, consulta, prévia, confirmação, cards inline e tela cheia, desktop e celular, Claude Code (`claude mcp add --transport http`).

### Etapa 7 — Publicação no diretório

Submissão em claude.ai/directory/manage: conta de teste, documentação pública, 3–5 capturas (≥ 1000 px) dos cards, URLs de privacidade/termos/suporte, descrição de cada tool. Começa como "Community"; "Verified" depois.

## Ordem e esforço

| Ordem | Etapa | Depende de |
| --- | --- | --- |
| 1 | 1 — extrair `mcpcore` | nada (pode começar já) |
| 2 | 2 — servidor Claude | 1 |
| 3 | 4 — cards no Claude | 1 |
| 4 | 5 — plugin e skills | 2 |
| 5 | 6.1 — testes locais | 2, 4 |
| 6 | 0 + 6.3 — OAuth e Claude real | domínio e Clerk (mesma pendência do ChatGPT) |
| 7 | 3 — ajuste fino da confirmação | teste real |
| 8 | 7 — diretório | tudo acima |

Etapas 1, 2, 4, 5 e 6.1 dá para fazer sem acesso a nada externo.

## Decisões em aberto

1. **Configurações no Claude:** manter `ler/atualizar_configuracoes` como tools comuns ou remover (recomendo remover no início; o Claude não tem painel de configurações de app).
2. **Confirmação dupla:** aceitar o prompt do Claude + Confirmar do card, ou simplificar depois do teste real (recomendo decidir só após o teste).
3. **Endpoint:** `/api/claude/mcp` separado (recomendado: audience, limites e auditoria separados) ou o mesmo `/api/mcp` detectando o cliente.
4. **Cliente OAuth:** DCR ou CIMD do Claude — depende do que o Clerk suporta no teste.

## Andamento

- **Etapa 1 — concluída (07/10/2026).** Núcleo em `src/products/mcpcore` (tools, actions, approvals/`decideDraft`, application/`executeTool`, preferências, manutenção, audit, auth/`resolvePrincipal`, ui). `PluginConfig.integration` substitui o `'chatgpt'` fixo em rascunhos, execuções, limites, preferências e manutenção; chave de idempotência `${integration}plugin:<rascunho>`; `renderCardsHtml({name, version})` e a URI dos cards passaram para o produto. `chatgptplugin` ficou com `mcp`, `extensions` (formulário nativo, painel), `auth/resourceMetadata`, página de revisão, `getPluginConfig()` e o pacote. Testes: só caminhos de import e o argumento `integration` mudaram.
- **Etapa 2 — concluída (07/10/2026).** `src/products/claudeplugin` com `/api/claude/mcp` e `/.well-known/oauth-protected-resource/api/claude/mcp` (liberados no `src/proxy.ts`). 35 tools (15 consultas + 20 escritas), todas as escritas com `destructiveHint: true`, sem painel, configurações, menções nem extensões OpenAI; cards `ui://claudeplugin/cards/v1.html` com `ui.domain`. Transporte HTTP comum em `mcpcore/mcp/http.ts` (também usado pelo ChatGPT). `CLAUDEPLUGIN_OAUTH_CLIENT_IDS=*` para DCR (exige `client_id` presente). Descrições de `registrar_baixa` e `estornar_pagamento` deixam claro que não movimentam dinheiro. Manutenção cobre as duas integrações. Teste: `claudeplugin:smoke` (10 grupos). Decisões aplicadas: endpoint separado; configurações removidas.
- **Etapa 4 (cards no Claude) — concluída (07/10/2026).** `renderCardsHtml({…, host})`; com `host: 'claude'`: lista inline em duas linhas com 3 itens e 2 indicadores, sem navegação por linha; filtros de situação e ordem como botões de escolha (sem `<select>`); detalhes inline com até 5 campos, sem tabelas, ação principal + "Ver detalhes"; navegação (`open`) só em tela cheia; prévia inline com até 4 campos e 3 itens + "Ver prévia completa" (Ajustar em tela cheia); botões e linhas com 44 px. Para os dois chats: `safeAreaInsets` viram margem e `fullscreen()` redesenha mesmo se o host recusar. Teste: `claudeplugin:cards-smoke` (4 cenários). A Etapa 3 (confirmação dupla) depende do teste no Claude real.
- **Etapa 5 — concluída (07/10/2026).** `src/products/claudeplugin/plugin/`: `.claude-plugin/plugin.json` (`cognito-erp`, licença provisória `UNLICENSED`), `README.md` (uso e dados), skills `usar-erp` e `get-started` reescritas para o Claude. `claudeplugin:package --url https://DOMINIO` gera `dist/claudeplugin/` e `dist/claudeplugin.zip` com `.mcp.json` (`type: http`, `/api/claude/mcp`) e valida estrutura, frontmatter, README ≥ 40 palavras, ausência de `bin/`, `.env` e segredos. `claudeplugin:package-smoke` (18 recusas).
- **Etapa 6 — parte local concluída (07/10/2026).** `claudeplugin:smoke` ganhou o cliente MCP oficial do SDK (conecta, lista, chama e lê o card), no lugar do Inspector local; `chatgptplugin:database-smoke` ganhou "Claude prepara e confirma pelo chat com integração própria" (repositórios reais: rascunho `claude`, isolamento do ChatGPT e da página de revisão, chave `claudeplugin:<rascunho>` na venda, auditoria e manutenção separadas). Inspector remoto, claude.ai, celular e Claude Code: roteiro em [`teste-claude-real.md`](teste-claude-real.md), dependem de domínio e Clerk.

## Riscos

- Refatoração da Etapa 1 mexe em código que já passa em todos os testes → fazer em passos pequenos, rodando as suítes a cada passo.
- Recursos MCP Apps implementados de forma diferente entre hosts (ex.: `tools/call` a partir do card) → fallback para `ui/message`.
- Revisão da Anthropic pode questionar `registrar_baixa` (dinheiro) → descrição explícita de que só registra.
