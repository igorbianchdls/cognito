# Testes das ferramentas de leitura — 04/10/2026

## Resultado

Catálogo com 24 ferramentas: 21 de leitura e 3 de escrita. Todas as 21 ferramentas de leitura foram chamadas por MCP usando o handler e os repositórios da aplicação, conectados ao Supabase real da empresa 1.

A rodada final passou em **72 verificações, sem falhas**, depois da correção da ordenação dos pagamentos. Os oito tipos disponíveis de relatório foram consultados e seus totais conferidos contra cálculos independentes dos registros do banco.

O servidor HTTP desta rodada era local, acessível somente por loopback, com identidade de teste em memória. Portanto, o resultado valida as consultas e as permissões da aplicação; a conexão OAuth completa ChatGPT → Clerk → endpoint publicado ainda precisa ser exercitada com login real.

## Cobertura das 21 ferramentas

| Ferramenta | Resultado verificado |
| --- | --- |
| `meu_acesso` | Usuário e empresas correspondem aos vínculos no Supabase. |
| `resumo_erp` | 30 clientes ativos e saldos financeiros disponíveis. |
| `buscar_cadastros` | Clientes, fornecedores, produtos e serviços; quantidades, identificadores, busca e ausência de resultados. |
| `obter_cliente` | Registro existente corresponde ao banco; identificador inexistente retorna `NOT_FOUND`. |
| `listar_vendas` | 150 vendas; filtros confirmada, rascunho e cancelada. |
| `obter_venda` | Número, valor e quantidade de itens; ausência retorna `NOT_FOUND`. |
| `verificar_fiscal_venda` | Identifica pendências fiscais esperadas, incluindo documento ausente do cliente demonstrativo. Não emite documento fiscal. |
| `listar_compras` | 60 compras; filtros recebida, rascunho e cancelada. |
| `obter_compra` | Número, valor e quantidade de itens; ausência retorna `NOT_FOUND`. |
| `consultar_financeiro` | Pagar e receber, valores e saldos, sete filtros de status de pagar, período inclusivo, busca e paginação. |
| `listar_contas_financeiras` | Contas ativas, nomes e tipos correspondem ao banco. |
| `listar_pagamentos` | Pagar e receber, duas páginas por tipo, identificadores e valores conferidos. |
| `consultar_estoque` | 40 posições de produto/local; nenhum saldo físico negativo. |
| `listar_orcamentos` | Lista vazia corresponde à ausência de orçamentos no banco. Caso com orçamento existente ainda não exercitado. |
| `consultar_relatorio` | Oito tipos, paginação e totais independentes; período superior a 366 dias recusado. |
| `abrir_painel` | Empresa selecionada e recurso HTML disponíveis via MCP. |
| `abrir_formulario` | Empresa selecionada e recurso HTML disponíveis via MCP. |
| `ler_configuracoes` | Valores, esquema e disposição de campos retornados; preferências preservadas. |
| `search_mentions` | Cliente encontrado, recurso JSON consultável e busca sem correspondência. |
| `listar_rascunhos` | Lista vazia corresponde à ausência de rascunhos para o usuário e a conexão de teste. |
| `obter_rascunho` | Identificador inexistente retorna `NOT_FOUND`. Caso com rascunho existente ainda não exercitado. |

Relatórios: `dre-caixa`, `posicao-financeira`, `vendas-clientes`, `vendas-vendedores`, `vendas-produtos`, `compras-fornecedores`, `compras-categorias` e `valor-estoque`. O relatório por vendedor retorna o agrupamento “Sem vendedor”, consistente com os dados demonstrativos atuais.

As respostas HTML foram verificadas pelo protocolo; esta rodada não verifica a interação visual dos componentes dentro do ChatGPT.

## Correção encontrada

Na primeira rodada, 71 verificações passaram e uma falhou: pagamentos a receber eram ordenados pelo identificador convertido em texto. Assim, `99` aparecia antes de `121`, prejudicando a ordem e a paginação.

Em `src/products/chatgptplugin/application/erpQueries.ts`, a ordenação passou a usar explicitamente a coluna numérica original: `ORDER BY erp.pagamentos.id DESC`. Os identificadores continuam sendo devolvidos como texto. A rodada completa foi repetida após a correção e ambas as consultas paginadas de pagamentos passaram.

**A correção está no código local. Nenhum novo deploy foi realizado nesta tarefa.**

## HTTP, permissões e preservação dos dados

- As consultas MCP usam `POST` com `tools/call`, inclusive quando são operações de leitura.
- `GET` autenticado no handler local retorna `405`, com `Allow: POST, OPTIONS`, conforme o contrato atual do servidor, que não mantém uma conexão SSE.
- Sem identidade, a chamada retorna `401`.
- Consulta financeira sem permissão e consulta de empresa fora dos vínculos retornam `ACCESS_DENIED`.
- Período invertido retorna `INVALID_INPUT`.
- Protocolo MCP convencional e protocolo moderno consultaram o financeiro real.
- A auditoria real registra sucesso e recusas, sem execuções deixadas em andamento.
- Os registros de 15 tabelas comerciais, as preferências e os rascunhos da conexão foram comparados antes e depois e permaneceram iguais.
- Nenhuma das três ferramentas de escrita foi chamada. Somente os registros operacionais normais de auditoria e limite de chamadas foram gravados.

Também foram feitos três testes HTTP no endereço publicado `https://cognito-seven.vercel.app`: metadados OAuth `200`, GET em `/api/mcp` sem login `401` com desafio de autenticação, e OPTIONS em `/api/mcp` `204`. Esses três testes passaram e são separados das 72 verificações locais.

## Evidência e reprodução

- Resultado final: `.cache/erp-audit/mcp-all-read.json`.
- Primeira rodada, antes da correção: `.cache/erp-audit/mcp-all-read-before-payment-fix.json`.
- Executor: `scripts/chatgptplugin-live-read-smoke.ts --all-read`.
- Casos adicionais: `scripts/chatgptplugin-read-tool-cases.ts`.
- Verificação TypeScript: `tsconfig.chatgptplugin.json`, sem erros.

Os recibos ficam na pasta ignorada `.cache`, sem publicar dados do banco no Git. O executor usa as credenciais locais sem imprimi-las, mantém o limite real de chamadas e impede a execução das três ferramentas de escrita.

```text
node node_modules/tsx/dist/cli.mjs scripts/chatgptplugin-live-read-smoke.ts --all-read
node node_modules/typescript/bin/tsc -p tsconfig.chatgptplugin.json --pretty false
```
