# Tables no MCP

31 ferramentas com prefixo `tables_`, registradas por `mcpcore/mcp/registerTables.ts` no ChatGPT e no Claude. Identidade e escolha de empresa continuam em `meu_acesso`. O executor comum encaminha ao domínio; as operações do Tables usam seus serviços e o papel restrito `tables_runtime`.

## Organização

- `schemas/catalog.ts`: contratos de consulta, alterações parciais, relações e lotes.
- `tools/catalog.ts`: nomes, descrições, documentação dos parâmetros e contratos publicados.
- `tools/card.ts`: apresentação MCP Apps para os dois chats.
- `actions/coordinator.ts`: prévia, versões, confirmação, cancelamento e consulta de resultado.
- `products/tables/server/mcp.ts`: adaptação dos serviços, paginação e operação de lotes.
- `products/tables/server/mcpUploads.ts`: formulário autenticado de upload autorizado no chat.

O código antigo do ERP foi transferido para `domains/erp`; os caminhos anteriores são adaptadores de compatibilidade. Novas tools ERP pertencem ao seu domínio.

## Ferramentas

| Área | Nomes após o prefixo `tables_` |
| --- | --- |
| Bases | listar_bases, obter_base, criar_base, editar_base |
| Tabelas | obter_tabela, criar_tabela, editar_tabela |
| Campos | criar_campo, editar_campo |
| Registros | consultar_registros, obter_registro, criar_registro, editar_registro, criar_registros_em_lote, editar_registros_em_lote, mover_registros_para_lixeira |
| Visualizações | criar_visualizacao, editar_visualizacao, excluir_visualizacao |
| Comentários e histórico | listar_comentarios, adicionar_comentario, consultar_historico |
| Lixeira | listar_lixeira, mover_para_lixeira, restaurar_item |
| Anexos | obter_link_anexo, remover_anexo, preparar_upload, confirmar_upload |
| Controle | obter_operacao, cancelar_operacao |

## Operação

As alterações recebem `empresa_id`, `chave_operacao` UUID e `dados`. O retorno pendente contém a prévia e `confirmar.argumentos`. Após aprovação explícita, a mesma tool recebe apenas `empresa_id` e `rascunho_id`. A confirmação repetida devolve o resultado já salvo. A chave identifica o mesmo pedido; reutilizá-la com dados diferentes gera conflito.

`tables_obter_operacao` aceita ID ou chave, sempre vinculados a usuário, empresa, cliente OAuth, chat e domínio. `tables_cancelar_operacao` cancela somente propostas pendentes. Uma operação finalizada não é desfeita por essa tool.

O contexto carrega o papel atual diretamente do vínculo organizacional. Leitor consulta; os papéis de escrita seguem o Tables existente. Os escopos de transporte atuais `erp:read`/`erp:write` são preservados nesta entrega; não representam novos planos ou permissões comerciais do Tables.

Edição omite o que deve ser preservado. Relações usam `definir`, `adicionar` ou `remover`; os dois últimos modos exigem campos múltiplos. Lotes pertencem a uma tabela e são atômicos. IDs repetidos, versões divergentes ou valores inválidos cancelam o lote.

`obter_base` pagina suas tabelas. `obter_tabela` usa `secao`, `pagina`, `campo_id`, `opcoes_pagina` e `visualizacao_id` para descobrir a estrutura sem respostas ilimitadas. Consultas de registros projetam colunas e informam truncamentos; `obter_registro.trecho` recupera partes de textos e relações extensas. Totais e somas correspondem ao filtro completo. Filtros se combinam por E.

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

Relatórios em `.cache/tables-mcp`. A suíte isolada executa as 31 tools e os handlers HTTP dos dois chats com PostgreSQL em memória, identidade fictícia e Storage simulado. A suíte de navegador testa os cards e o formulário real com respostas de teste. A validação ao vivo usa sessão Clerk real na aplicação, transações reais do MCP invocadas diretamente no backend e Storage real. Ela não representa uma sessão interativa dentro dos aplicativos ChatGPT/Claude nem uma emissão real de token OAuth de teste.

Fórmulas, automações, importação/exportação, filtros OU, novos planos e permissões comerciais não fazem parte desta entrega.
