# Tables no MCP

Ferramentas com prefixo `tables_`, registradas por `mcpcore/mcp/registerTables.ts` no ChatGPT e no Claude. Identidade e escolha de empresa continuam em `meu_acesso`. O executor comum encaminha ao domínio; as operações do Tables usam seus serviços e o papel restrito `tables_runtime`.

## Organização

- `schemas/catalog.ts`: contratos de consulta, alterações parciais, relações e lotes.
- `tools/catalog.ts`: nomes, descrições, documentação dos parâmetros e contratos publicados.
- `tools/card.ts`: apresentação MCP Apps para os dois chats.
- `actions/coordinator.ts`: prévia, versões, confirmação, cancelamento e consulta de resultado.
- `products/tables/server/mcp.ts`: adaptação dos serviços, paginação e operação de lotes.
- `products/tables/server/mcpUploads.ts`: formulário autenticado de upload autorizado no chat.

O código antigo do ERP foi transferido para `domains/erp`; os caminhos anteriores são adaptadores de compatibilidade. Novas tools ERP pertencem ao seu domínio.

## Ferramentas

18 ferramentas com prefixo `tables_` (antes 31; as definições caíram de ~17 mil para ~7,8 mil tokens).

| Área | Nomes após o prefixo `tables_` |
| --- | --- |
| Consulta | listar_bases (com base_id traz a base e suas tabelas), obter_tabela, consultar_registros, obter_registro, resumir, listar_atividade, listar_lixeira, obter_link_anexo |
| Alteração | salvar_base, salvar_tabela, salvar_campo, salvar_registros, salvar_visualizacao, comentar, lixeira, anexos |
| Controle | obter_operacao, cancelar_operacao |

## Nomes e IDs

Campos, opções, pessoas (nome ou e-mail), registros vinculados (pelo campo principal) e visualizações aceitam nome ou ID. `products/tables/server/mcpInput.ts` resolve os nomes uma única vez, na entrada; prévia, snapshot e execução continuam só com IDs. Nome inexistente devolve `UNKNOWN_REFERENCE` com as opções disponíveis; nome repetido devolve `AMBIGUOUS_REFERENCE` e pede o ID. Bases, tabelas, registros e anexos usam IDs. `exibicao` traz os valores legíveis por nome do campo.

## Operação

As alterações recebem `empresa_id`, `chave_operacao` UUID e `dados`.

- **Executam direto** (só acrescentam dados): criar base, tabela, campo, visualização ou um registro; comentar; preparar e confirmar upload. O retorno já vem com `status: saved` e o resultado.
- **Geram prévia** (alteram ou removem): edições, lotes de registros, excluir visualização, lixeira (mover e restaurar) e remover anexo. O retorno pendente contém a prévia e `confirmar.argumentos`; após aprovação explícita, a mesma tool recebe apenas `empresa_id` e `rascunho_id`.

Nos dois casos a chave fica registrada: repetir a chamada com os mesmos dados devolve o mesmo resultado, e reutilizá-la com dados diferentes gera conflito. Os rascunhos guardam a operação interna (`criar_base`, `editar_campo`…) e a entrada original.

`tables_resumir` conta e agrega no banco todo o conjunto filtrado: agrupa por seleção, pessoas, vínculo, checkbox, texto ou data (dia, mês ou ano) e calcula soma, média, mínimo e máximo. Até 50 grupos.

`tables_obter_operacao` aceita ID ou chave, sempre vinculados a usuário, empresa, cliente OAuth, chat e domínio. `tables_cancelar_operacao` exige escopo de escrita e cancela somente prévias pendentes.

O contexto carrega o papel atual diretamente do vínculo organizacional. Leitor consulta; os papéis de escrita seguem o Tables existente. Edição omite o que deve ser preservado. Relações usam `definir`, `adicionar` ou `remover`; os dois últimos exigem campos múltiplos. Lotes pertencem a uma tabela e são atômicos.

## Card

`tools/card.ts` usa o sistema de cards do ERP (`mcpcore/ui`: estilos, componentes e ponte MCP Apps) com telas próprias: prévia e resultado da operação, registros com totais, registro, resumo por grupos, listas e link de anexo.

## Arquivos

`preparar_upload` pode receber somente registro e campo de anexo. Depois da aprovação, o resultado `aguardando_envio` traz um formulário autenticado em `/tables/upload/:operacao_id`. O usuário seleciona o arquivo; o navegador transfere os bytes diretamente ao Storage privado e o backend confirma o objeto. Nome, tamanho e MIME podem ser informados antecipadamente quando conhecidos.

O formulário só aceita a conta e a empresa da autorização, com vínculo atual de escrita. Repetir a preparação reutiliza o mesmo anexo; se uma resposta de upload se perder, a confirmação verifica o objeto já recebido. A conversa pode consultar o resultado e reconhecer a confirmação feita no formulário. Credenciais de Storage não são enviadas ao chat ou navegador.

## Persistência e publicação

`20261016193000_mcp_product_domains.sql` adiciona domínio, tipo de operação, resultado e índice de idempotência por domínio, conservando a unicidade antiga durante a atualização. O domínio padrão dos rascunhos anteriores é ERP.

Depois de publicar e validar o código que usa a chave por domínio, `20261016200000_mcp_domain_uniqueness.sql` remove a restrição antiga. Essa ordem mantém a versão anterior funcionando até a promoção. A confirmação do Tables salva dados, resultado e auditoria transacional na mesma transação.

Os scripts de aplicação verificam os hashes testados e a preservação dos rascunhos existentes. Após a segunda migration, um rollback para o código anterior à adaptação de domínios requer também revisar a compatibilidade de sua cláusula ON CONFLICT; não apontar o domínio para essa versão automaticamente.

## Verificação

```text
node scripts/tables/mcp-validation.mjs
node --import tsx scripts/tables/mcp-ui-smoke.mjs
node scripts/tables/mcp-database.mjs --check
node scripts/tables/mcp-database.mjs --apply
node scripts/tables/mcp-stage.mjs --production
node scripts/tables/mcp-deployment.mjs status
node --import tsx scripts/tables/mcp-live.ts
node scripts/tables/mcp-deployment.mjs promote
node --import tsx scripts/tables/mcp-live.ts --production
node scripts/tables/mcp-database.mjs --finalize
```

Relatórios em `.cache/tables-mcp`. A suíte isolada executa as 18 tools e os handlers HTTP dos dois chats com PostgreSQL em memória, identidade fictícia e Storage simulado. A suíte de navegador testa os cards e o formulário real com respostas de teste. A validação ao vivo usa sessão Clerk real na aplicação, transações reais do MCP invocadas diretamente no backend e Storage real. Ela não representa uma sessão interativa dentro dos aplicativos ChatGPT/Claude nem uma emissão real de token OAuth de teste.

Fórmulas, automações, importação/exportação, filtros OU, novos planos e permissões comerciais não fazem parte desta entrega.
