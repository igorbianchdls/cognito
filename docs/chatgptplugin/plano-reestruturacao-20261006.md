# Plano de reestruturação — chatgptplugin 2.0

Data: 06/10/2026. Escopo: tudo exceto nota fiscal, cobrança e integração bancária (fases futuras).

## Objetivo

O usuário da PME consulta, cria, altera e confirma operações do ERP **sem sair do ChatGPT**, com tools que passam na revisão da OpenAI (sem executor genérico, anotações corretas, UI conforme as diretrizes).

## Decisões

1. **Uma tool por ação de escrita; o tipo de objeto vira parâmetro.** Ações com riscos diferentes nunca dividem a mesma tool.
2. **Consultas por área**, agrupando apenas quando filtros e resultado têm o mesmo formato (cadastros; vendas + orçamentos).
3. **Aprovação dentro do chat, na própria tool.** Cada tool de escrita tem duas fases:
   - **Prévia** (sem `rascunho_id`): valida, calcula valores no ERP, registra o rascunho e o snapshot do alvo, devolve o card de revisão.
   - **Execução** (com `rascunho_id`): o botão *Confirmar* do card chama a mesma tool; o servidor confere tipo, autor, empresa, cliente OAuth, validade, permissões atuais e o hash do alvo (`STALE_PROPOSAL`), e executa na mesma transação da auditoria.

   Assim as anotações continuam corretas por ação (não existe uma tool `confirmar_operacao` genérica) e a confirmação nativa do ChatGPT funciona como camada adicional. A página de aprovação no ERP vira opção por empresa, desligada por padrão.
4. **O motor atual é reaproveitado.** As novas tools são fachadas sobre `proposalSchema`, `prepareDraft`, `operationSnapshot`, `executeOperation` e as regras do ERP. Nenhuma regra comercial nova, nenhuma migração obrigatória.
5. **Versão 2.0.0**: os nomes das tools mudam (quebra de contrato).

## Tools finais (37, sem fiscal)

Legenda: RO = `readOnlyHint:true`; W = escrita não destrutiva; D = `destructiveHint:true`. Todas com `openWorldHint:false`.

### Consultas (15, RO)

| Tool | Origem atual |
| --- | --- |
| `meu_acesso` (+ `_meta["openai/profile"]`) | `meu_acesso` |
| `resumo_erp` | igual |
| `buscar_cadastros` (7 tipos, inclui contas financeiras) | absorve `listar_contas_financeiras` |
| `obter_cadastro` | absorve `obter_cliente` |
| `listar_vendas` (`tipo_documento: venda\|orcamento`) | absorve `listar_orcamentos` |
| `obter_venda` | igual |
| `listar_compras` | igual |
| `obter_compra` | igual |
| `consultar_financeiro` | igual (parcelas) |
| `obter_titulo_financeiro` | igual |
| `obter_parcela_financeira` | igual |
| `listar_pagamentos` | igual |
| `consultar_estoque` | igual |
| `analisar_periodo` | igual |
| `consultar_relatorio` | igual |

### Escrita (19)

| Tool | Parâmetro de tipo | Anotação | Tipos de proposta atuais |
| --- | --- | --- | --- |
| `criar_cadastro` | `cliente\|fornecedor\|vendedor\|produto\|servico\|categoria\|conta_financeira` | W | `cliente`, `fornecedor`, … |
| `editar_cadastro` | idem | W | `editar_*` de cadastro |
| `excluir_cadastro` | idem | D | `excluir_*` de cadastro |
| `criar_venda` | `venda\|orcamento` | W | `venda`, `orcamento` |
| `editar_venda` | `venda\|orcamento` | W | `editar_venda`, `editar_orcamento` |
| `excluir_venda` | `venda\|orcamento` | D | `excluir_venda`, `excluir_orcamento` |
| `confirmar_venda` | — | W | `confirmar_venda` |
| `cancelar_venda` | — | D | `cancelar_venda` |
| `atender_venda` | — | W | `atender_venda` |
| `criar_compra` | — | W | `compra` |
| `editar_compra` | — | W | `editar_compra` |
| `excluir_compra` | — | D | `excluir_compra` |
| `confirmar_compra` | — | W | `confirmar_compra` |
| `cancelar_compra` | — | D | `cancelar_compra` |
| `criar_titulo` | `pagar\|receber` | W | `conta_pagar`, `conta_receber` |
| `editar_titulo` | `pagar\|receber` | W | `editar_conta_*` |
| `excluir_titulo` | `pagar\|receber` | D | `excluir_conta_*` |
| `registrar_baixa` | `pagar\|receber` | W | `pagar_parcela`, `receber_parcela` |
| `estornar_pagamento` | — | D | `estornar_pagamento` |

`idempotentHint:true` apenas onde a `chave_operacao` garante repetição sem efeito duplicado (todas as de escrita, por desenho).

### Interface e configurações (3)

| Tool | Anotação |
| --- | --- |
| `abrir_painel` (tela cheia / sidebar) | RO |
| `ler_configuracoes` | RO |
| `atualizar_configuracoes` | W |

### Removidas (11)

`renderizar_card`, `preparar_rascunho`, `preparar_formulario_nativo`, `obter_rascunho`, `listar_rascunhos`, `abrir_formulario`, `obter_cliente`, `listar_orcamentos`, `listar_contas_financeiras` e, no escopo desta fase, as tools fiscais (ver *Decisões em aberto*).

## Fases

### Fase 0 — OAuth real (bloqueante)

1. Criar o cliente OAuth no Clerk de produção e conectar no ChatGPT (modo desenvolvedor).
2. Confirmar: suporte a CIMD (`client_id = https://chatgpt.com/oauth/client.json`) ou DCR; `resource` copiado para `aud`; PKCE S256; `iss` na resposta (RFC 9207).
3. Ajustar `validateOAuthToken` (`auth/resolvePrincipal.ts`): substituir a lista fixa `CHATGPTPLUGIN_OAUTH_CLIENT_IDS` por aceitação do client CIMD do ChatGPT ou dos clientes registrados por DCR.
4. Se o Clerk não atender o item 2: decidir migração para Auth0 ou Stytch antes da Fase 1.
5. Cache curto (30–60 s) da introspecção por token para reduzir latência.

Saída: `meu_acesso` funcionando no ChatGPT web e mobile com uma conta real.

### Fase 1 — Novo catálogo de tools

Arquivos:
- `tools/catalog.ts`: consultas consolidadas (remove 3, adiciona `tipo_documento` em `listar_vendas`), descrições no formato “Use quando… / Não use para…”, `outputSchema` real por tool.
- `actions/catalog.ts` (reescrito): 19 definições de escrita. Cada uma declara `tipos` → mapeamento para `Proposal['tipo']`, esquema de entrada derivado de `proposalSchema`/`expandedSchemas`, anotação e capacidades (`proposalCapabilities`).
- `actions/twoPhase.ts` (novo): `previa()` → `prepareDraft` + snapshot; `executar()` → núcleo de `decideApproval` adaptado para `PluginPrincipal` (sem sessão de navegador), exigindo `erp:write`, mesmo tipo de proposta e mesmo autor/empresa/cliente OAuth.
- `approvals/approvalRepository.ts`: extrair o núcleo transacional de `decideApproval` para reuso pelas duas origens (chat e página do ERP).
- `mcp/createServer.ts`: registrar as 37 tools; remover o Proxy de anotações padrão (cada definição declara as suas); remover `renderizar_card`, `abrir_formulario` e o registro de `preparar_formulario_nativo`.
- `application/executeTool.ts`: erros de validação com campo e motivo (`issues[].path`); `VALIDATION_ERROR` do ERP deixa de virar `NOT_FOUND`.
- Server instructions: reescrever com os pontos essenciais nos primeiros 512 caracteres.

### Fase 2 — Interface

- **Cards ligados direto às tools** por `_meta.ui.resourceUri` (sem consulta dupla):
  - consultas de lista → card *lista* inline compacto (até 5 linhas, 1 ação: “Ver tudo” abre tela cheia);
  - `obter_*` → card *detalhes*;
  - `analisar_periodo` / `consultar_relatorio` → card *análise*;
  - escrita → card *revisão* (antes/depois, total calculado, botões **Confirmar** e **Ajustar**) e, após executar, card *resultado*.
- Tabela completa com filtros, paginação e ordenação só em **tela cheia**; painel apenas em tela cheia/sidebar.
- Estilos: `hostContext.styles.variables` do ChatGPT, sem fundo próprio; cor da marca `#345CE6` só em destaques; remover bordas/raios grandes e `h1` de 25 px.
- Ponte: tratar `ui/notifications/host-context-changed` para tema e variáveis.

### Fase 3 — Coleta de dados sem ID e sem JSON

- Formulário nativo por tool de escrita quando faltam campos obrigatórios (elicitation dentro da própria tool; remove `preparar_formulario_nativo`).
- Campos de referência (cliente, fornecedor, produto, serviço, categoria, conta financeira) como listas de opções `{const,title}` preenchidas com a busca na empresa; fallback para busca por nome.
- Itens e parcelas: o modelo monta a lista a partir da conversa; o card de revisão exibe tabela editável simples (quantidade, preço, desconto).

### Fase 4 — Skills, metadados e textos

- Reescrever `usar-erp` e `get-started` para o novo catálogo e o fluxo prévia → confirmar.
- `plugin.json`: versão 2.0.0, `defaultPrompt` e descrições revisadas.
- Corrigir acentuação em mensagens, labels e skills.

### Fase 5 — Testes e publicação

- Atualizar os smokes: `smoke`, `cards-smoke`, `form-smoke`, `mrtr-smoke`, `interface-smoke`, `live-read-smoke`, `live-crud-smoke`, `read-tool-cases`, `package-smoke`.
- Novos testes da execução em duas fases: tipo trocado, autor/cliente OAuth diferente, rascunho expirado, alvo alterado, permissão revogada, repetição idempotente, falta de `erp:write`.
- Conjunto de prompts de referência (diretos, indiretos, negativos) para medir escolha de tool.
- Teste manual no ChatGPT web e mobile: login, consultas, prévia, confirmação nativa, confirmação pelo card, tema claro/escuro.
- Publicação: domínio, política de privacidade e termos, conta demo sem 2FA com dados, respostas esperadas dos prompts de teste.

## Riscos

| Risco | Mitigação |
| --- | --- |
| Clerk não suportar CIMD/DCR ou `resource` → `aud` | Fase 0 antes de tudo; plano B Auth0/Stytch |
| Confirmação nativa do ChatGPT também na fase de prévia (dupla confirmação) | Validar no ChatGPT real; se incomodar, separar a prévia em tool somente leitura sem gravar rascunho |
| Modelo chamar a execução sem o usuário ver o card | Execução exige `rascunho_id` existente; anotações garantem a confirmação nativa; tools destrutivas sempre confirmadas |
| Quebra para conexões existentes | Versão 2.0.0; não há usuários em produção ainda |

## Decisões em aberto

1. ~~Fiscal simulado nesta fase~~ — **removido do chat** na Fase 1 (as propostas `*_nota_servico` continuam no contrato para a fase fiscal).
2. **Página de aprovação no ERP:** continua funcionando, mas o chat não oferece mais o link. A opção por empresa fica para depois.
3. **Provedor OAuth:** depende do resultado da Fase 0.

## Andamento

- **Fase 0 (código):** motivo da recusa nos logs, cache de 30 s da verificação, `check-config` informa CIMD/DCR/`iss`. Falta o teste com token real.
- **Fase 1 (concluída):** 37 tools + `search_mentions` do SDK; escrita em duas etapas (`actions/catalog.ts`, `actions/dependencies.ts`, `decideDraft` em `approvals/approvalRepository.ts`); saídas declaradas (`tools/outputs.ts`); erros com `campos`; instruções do servidor reescritas. Removidos `renderizar_card`, `abrir_formulario`, `preparar_formulario_nativo`, `obter_rascunho`, `listar_rascunhos`, tools fiscais e as consultas duplicadas. Pendências movidas: perfil `openai/profile` em `meu_acesso` (Fase 4), cards ligados às tools (Fase 2), formulário nativo por tool (Fase 3).
- **Fase 2 (concluída):** recurso `ui://chatgptplugin/cards/v2.html` ligado a todas as consultas, a `meu_acesso` e às 19 escritas. Cards: lista (inline até 5 linhas + "Ver tudo"; tela cheia com busca e paginação), detalhes, análise em barras, resumo, empresas, revisão (antes/depois, nomes no lugar de IDs, total do ERP, Confirmar/Ajustar) e resultado. Estilo pelas variáveis do host, sem fundo próprio. Painel também usa as variáveis do host.
- **Fase 3 (concluída):** formulário nativo dentro das tools de escrita (`extensions/nativeForm.ts`) para clientes MCP 2026-07-28 com `openai/elicitation.form`: abre quando faltam campos obrigatórios, traz valores já informados, usa listas com nomes para cliente, fornecedor, vendedor, categoria, conta financeira e registro de cadastro (até 50 opções). Itens e parcelas são montados pelo modelo; no card, Ajustar edita quantidade, preço e desconto e gera nova prévia.
- **Fase 4 (concluída):** skills `usar-erp` e `get-started` reescritas para o catálogo novo e o fluxo prévia → confirmação; manifesto 2.0.0 (categoria Business & Operations, descrições e prompts novos); `meu_acesso` marcado como perfil (`openai/profile`, ID do Clerk, nome e e-mail do usuário); acentuação das mensagens; README do produto reescrito; pacote validado.
- **Próximo:** teste de login real (Fase 0) e uso no ChatGPT em modo desenvolvedor; depois Fase 5 (prompts de referência, conta demo, publicação).
