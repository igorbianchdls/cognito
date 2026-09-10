# Etapa 3 — Dashboards sem execução de BigQuery

Implementada localmente em 07/09/2026.

## Alterações

- Retirada a execução de consultas dos dashboards. O endpoint antigo conserva autenticação e verificação de acesso ao artefato e retorna HTTP 410 (`dashboard_query_retired`) para uma consulta autorizada.
- O cliente de consultas não faz requisições nem tentativas repetidas. Dashboards antigos com consultas apresentam a mensagem de fonte desativada.
- Removidos o preview de consultas, sua ferramenta e os contratos de SQL do plugin. A criação orientada pelo plugin agora usa valores de indicadores e listas de registros fornecidos diretamente.
- A validação estática identifica atributos JSX `query`/`dataQuery` e componentes `Query`, sem executar expressões. Criação e edição rejeitam essas construções antes de gravar a nova versão. A validação da árvore também rejeita propriedades de consulta; a proteção definitiva contra execução permanece no cliente e no endpoint aposentados.
- Gráficos, tabelas e tabelas dinâmicas aceitam registros diretamente. Indicadores aceitam valores diretamente; ausência de valor aparece como `-`, sem virar zero.
- Retirados sete modelos dependentes de SQL: Compras, Financeiro, Meta Ads, Google Ads, Shopify, Containers e Layout Test. O modelo inicial contém listas vazias e indicador sem valor, sem números inventados. Os relatórios nativos do ERP não foram removidos.
- Preservados edição, temas, persistência e renderização dos artefatos independentes de consultas.

## Verificações

Todos os registros abaixo terminaram com código 0:

| Verificação | Evidência |
| --- | --- |
| Tipos globais, sem cache incremental | [global-typecheck.log](verificacoes/global-typecheck.log) |
| Tipos de artefatos | [artifacts-typecheck.log](verificacoes/artifacts-typecheck.log) |
| Tipos do ERP | [erp-typecheck.log](verificacoes/erp-typecheck.log) |
| Templates, contrato, rejeição de consultas e isolamento | [dashboard-inline.log](verificacoes/dashboard-inline.log) |
| Renderização real em Edge headless | [render.log](verificacoes/render.log) |
| Arquitetura de artefatos | [architecture.log](verificacoes/architecture.log) |
| Plugin | [plugin.log](verificacoes/plugin.log) |
| Ferramentas locais preservadas e externas rejeitadas | [plugin-local.log](verificacoes/plugin-local.log) |

O teste de renderização usa os componentes reais em servidor local isolado: verifica indicador 123, indicador sem dados, barra de gráfico, tabela contendo Alice e tabela dinâmica totalizando 20. Não houve consultas de dados ou chamadas externas. O teste do serviço usa persistência simulada para verificar os resultados 410 e 403; não acessa banco real.

`git diff --check` passou. As alterações preexistentes dos dois arquivos Remotion foram preservadas: o patch tem SHA-256 `2CBE209D2ADCE6DEC541788843D0DCEAFF003E1C6DAB7FCD6FFC90CB00807D9A`, igual ao registro inicial.

## Limites e próxima etapa

Esta etapa não remove fisicamente todo o produto Integrações, seus adaptadores externos, APIs e dependências. Essa limpeza pertence à etapa 4. Nenhum recurso GCP, credencial, schema ou dashboard salvo foi apagado ou migrado. Não foi adicionado executor livre de SQL PostgreSQL.

Não houve build/deploy nem teste de sessão autenticada completa. A falha preexistente do comando de lint continua registrada na etapa 1. Nenhum commit foi criado.
