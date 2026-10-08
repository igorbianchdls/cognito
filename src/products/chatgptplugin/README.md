# ChatGPT Plugin — Cognito ERP

Produto `chatgptplugin`, versão **2.0.0**. Servidor MCP que leva o Cognito ERP para dentro do ChatGPT: consultas com cards, alterações com prévia e confirmação na própria conversa, formulário nativo com listas de opções e configurações pessoais.

Nota fiscal, cobrança e integração bancária ficam para fases futuras e não estão expostas no chat. O plano e o andamento estão em [`docs/chatgptplugin/plano-reestruturacao-20261006.md`](../../../docs/chatgptplugin/plano-reestruturacao-20261006.md).

## Estrutura

Consultas, escritas, auditoria, verificação do token e cards ficam no núcleo compartilhado [`mcpcore`](../mcpcore/README.md). Este produto contém só o que é do ChatGPT:

| Pasta | Responsabilidade |
| --- | --- |
| `mcp` | SDK MCP, transporte sem sessão, protocolo 2026-07-28 (discovery, MRTR), registro das tools e recurso dos cards (`ui://chatgptplugin/cards/v2.html`) |
| `auth` | Metadados do recurso protegido |
| `approvals` | Página e API de revisão no ERP (`/chatgptplugin/approvals/[id]`) |
| `extensions` | Formulário nativo da OpenAI e painel |
| `shared` | `getPluginConfig()` (`integration: 'chatgpt'`) e versão |
| `plugin` | Manifesto, ícone e skills `usar-erp` / `get-started` |

## Tools (46)

Todas exigem `erp:read`; as de escrita exigem também `erp:write` e as permissões do perfil no ERP. O servidor lista 50 descritores porque a extensão oficial de menções registra `search_mentions`.

**Consultas (17, somente leitura):** `meu_acesso` (também perfil da conexão, `openai/profile`), `resumo_erp`, `buscar_cadastros`, `obter_cadastro`, `listar_vendas` (com `tipo_documento: venda|orcamento`), `obter_venda`, `listar_compras`, `obter_compra`, `listar_notas_servico`, `obter_nota_servico`, `consultar_financeiro`, `obter_titulo_financeiro`, `obter_parcela_financeira`, `listar_pagamentos`, `consultar_estoque`, `analisar_periodo`, `consultar_relatorio`.

**Escritas (28):** uma tool por ação; o parâmetro `tipo` escolhe o objeto.

| Área | Tools | `tipo` | Destrutivas |
| --- | --- | --- | --- |
| Cadastros | `criar_cadastro`, `editar_cadastro`, `excluir_cadastro` | 7 tipos de cadastro | `excluir_cadastro` |
| Vendas e orçamentos | `criar_venda`, `editar_venda`, `excluir_venda`, `converter_orcamento`, `confirmar_venda`, `cancelar_venda`, `atender_venda` | `venda`, `orcamento` | `excluir_venda`, `cancelar_venda` |
| Compras | `criar_compra`, `editar_compra`, `excluir_compra`, `confirmar_compra`, `cancelar_compra` | — | `excluir_compra`, `cancelar_compra` |
| Financeiro | `criar_titulo`, `editar_titulo`, `excluir_titulo`, `registrar_baixa`, `estornar_pagamento` | `pagar`, `receber` | `excluir_titulo`, `estornar_pagamento` |
| NFS-e simulada | `criar_nota_servico`, `editar_nota_servico`, `emitir_nota_servico`, `consultar_nota_servico`, `cancelar_nota_servico`, `excluir_nota_servico` | — | `cancelar_nota_servico`, `excluir_nota_servico` |

**Interface e configurações (3):** `abrir_painel` (tela cheia e barra lateral), `ler_configuracoes`, `atualizar_configuracoes`.

Anotações: consultas com `readOnlyHint: true`; escritas com `readOnlyHint: false`, `destructiveHint` conforme a tabela, `idempotentHint: true` (garantido pela `chave_operacao`) e `openWorldHint: false`. Cada tool declara `outputSchema`.

## Escrita em duas etapas

1. **Prévia:** a tool recebe `chave_operacao` (UUID), `dados` e, quando houver, `tipo`. Valida com o contrato exato do tipo, confere referências na empresa, calcula totais pelo ERP, guarda o rascunho (24 h) e o estado atual do registro alvo. Nada muda no ERP. A resposta traz `etapa: previa`, os nomes das referências e `confirmar` com a chamada de execução.
2. **Execução:** a mesma tool recebe somente `empresa_id` e `rascunho_id`. Em uma transação, o servidor bloqueia o rascunho, confere autor, empresa, cliente OAuth e tipo da operação, revalida vínculo e permissão atuais, compara o estado do alvo (`STALE_PROPOSAL` se mudou), executa e grava a auditoria. Repetir a execução devolve o mesmo resultado sem duplicar o efeito.

A página `/chatgptplugin/approvals/[id]` continua funcionando com o mesmo núcleo (`decideApproval` → `decideDraft`), mas o chat não oferece mais o link.

Erros devolvem `code`, `message` e, quando aplicável, `campos: [{campo, motivo}]` para o modelo corrigir os argumentos.

## Cards

Recurso `ui://chatgptplugin/cards/v2.html`, ligado por `_meta.ui.resourceUri` às 16 consultas e às 22 escritas. O card identifica a tool por `hostContext.toolInfo` (ou `_meta["cognito/tool"]` no resultado).

- **Lista:** inline com resumo e até 5 linhas, uma ação ("Ver tudo"); em tela cheia, tabela completa, busca e paginação.
- **Detalhes, análise (barras por mês), resumo, empresas** ("Usar esta" envia a escolha à conversa).
- **Revisão:** antes/depois, nomes no lugar de IDs, itens, parcelas e total do ERP; botões Confirmar e Ajustar. Ajustar edita quantidade, preço e desconto e gera nova prévia, informando o modelo por `ui/update-model-context`. Exclusões, cancelamentos e estornos mostram aviso.
- **Resultado:** só `saved` com registro confirma a operação.

HTML autocontido; dados entram por `textContent`; CSP sem destinos externos. Estilo pelas variáveis do host (`hostContext.styles.variables`), sem fundo próprio; a cor da marca aparece só no botão principal.

## Formulário nativo

Para clientes MCP **2026-07-28** que anunciam `extensions["openai/elicitation"].form`: quando uma prévia chega sem campos obrigatórios, a própria tool responde `resultType: input_required` com um formulário OpenAI. Valores já informados vêm preenchidos; cliente, fornecedor, vendedor, categoria, conta financeira e o registro das tools de cadastro aparecem como lista com nomes (até 50 opções ativas). Itens e parcelas são montados pelo modelo a partir da conversa.

O estado (`requestState`) usa AES-256-GCM, expira em 10 minutos e é vinculado a tool, argumentos, empresa, usuário, cliente OAuth e recurso. A chave `CHATGPTPLUGIN_FORM_STATE_KEY` deve ser a mesma em todas as instâncias. Cancelar o formulário não cria prévia. Clientes sem esse suporte recebem os `campos` que faltam.

## Autenticação

Cada POST valida `Authorization: Bearer` como **OAuth access token JWT** do Clerk (`at+jwt`), com `iss` igual a `CHATGPTPLUGIN_OAUTH_ISSUER` e `aud` contendo `${CHATGPTPLUGIN_BASE_URL}/api/mcp`, e confirma com a introspecção do Clerk (revogação, cliente permitido, scopes). A verificação fica em cache por 30 s por token. Recusas retornam 401 com `WWW-Authenticate`; o motivo (`reason`) vai apenas para o log do servidor.

**Pendente:** comprovar com um token real que o Clerk grava o `resource` no `aud` e definir o modo de cliente (CIMD `https://chatgpt.com/oauth/client.json`, DCR ou cliente cadastrado). `pnpm chatgptplugin:check-config` informa o que o emissor anuncia.

Variáveis (`.env.example`): `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `SUPABASE_DB_URL`, `CHATGPTPLUGIN_BASE_URL`, `CHATGPTPLUGIN_OAUTH_ISSUER`, `CHATGPTPLUGIN_OAUTH_CLIENT_IDS`, `CHATGPTPLUGIN_ALLOWED_ORIGINS`, `CHATGPTPLUGIN_FORM_STATE_KEY`.

## Persistência e limites

Schema privado `plugin` (compartilhado com a integração Claude, filtrado por `integration='chatgpt'`): `executions`, `rate_windows`, `drafts`, `settings`. RLS ativo e acesso revogado para `PUBLIC`, `anon` e `authenticated`. A auditoria guarda metadados, nunca argumentos ou resultados; rascunhos podem conter dados pessoais.

Limites: 60 pedidos por usuário por minuto; corpo de 64 KB recebido em até 5 s; resultado de 128 KB; páginas de 10 a 50; detalhes com até 100 itens; propostas com até 50 itens e 24 KB; consultas com 10 s no banco e 15 s na tool. `chatgptplugin:maintenance` remove janelas antigas e encerra execuções e rascunhos vencidos.

## Validação

```text
pnpm chatgptplugin:typecheck
pnpm chatgptplugin:smoke
pnpm chatgptplugin:auth-smoke
pnpm chatgptplugin:mrtr-smoke
pnpm chatgptplugin:database-smoke
pnpm chatgptplugin:cards-smoke
pnpm chatgptplugin:interface-smoke
pnpm chatgptplugin:package-smoke
```

Todos rodam localmente, sem Clerk, Supabase ou ChatGPT reais: o banco usa PGlite com os repositórios e o SQL reais; cards e painel rodam em navegador com host MCP Apps simulado. `chatgptplugin:live-read-smoke` e `chatgptplugin:live-crud-smoke` usam o Supabase de `.env.local` e só devem ser executados com autorização.

## Pacote

```text
pnpm chatgptplugin:package --url https://DOMINIO_REAL
pnpm chatgptplugin:validate-package dist/chatgptplugin
```

Gera `dist/chatgptplugin/` e `dist/chatgptplugin.zip` (manifesto, conexão MCP, ícone, duas skills e README), validados offline contra os esquemas Agent Plugins 1.0.0. Para publicar ainda faltam domínio real, URLs de website, privacidade, termos e suporte, conta de demonstração sem 2FA e teste no ChatGPT web e mobile.
