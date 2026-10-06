# Dashboards do ERP

## Onde está cada responsabilidade

| Camada | Arquivos | Responsabilidade |
| --- | --- | --- |
| Contratos | `../../shared/dashboardContracts.ts` | Filtros, validação de datas, tipos de indicadores/gráficos/listas e resposta. Não contém queries. |
| Consulta por dashboard | `visaoGeralQueries.ts`, `financeiroQueries.ts`, `vendasQueries.ts`, `comprasQueries.ts`, `estoqueQueries.ts`, `resultadosQueries.ts`, `servicosQueries.ts` | SQL e composição dos indicadores de cada área. |
| Recursos comuns | `common.ts` | Movimentos de caixa, saldo por conta, comparação, links e rankings. |
| Serviço | `dashboardService.ts` | Permissões, contexto de empresa e snapshot de leitura consistente. |
| Conferência | `drilldownQueries.ts`, `drilldownLinks.ts` | Consultas paginadas dos registros e filtros dos links dos indicadores/rankings. |
| HTTP | `../../api/handlers/dashboards/` | Sessão, parâmetros e resposta; sem SQL. |
| Interface | `../../frontend/modules/dashboards/` | Uma pasta por dashboard e componentes compartilhados. |

## API

- `GET /api/erp/dashboards/[dashboardId]?from=2026-09-01&to=2026-09-30&compare=true&includeForecast=false`
- `GET /api/erp/dashboards/[dashboardId]/registros?source=vendas&from=2026-09-01&to=2026-09-30&page=1&pageSize=20`

Os sete IDs são `visao-geral`, `financeiro`, `vendas`, `compras`, `estoque`, `resultados` e `servicos`. Parâmetros desconhecidos ou duplicados são rejeitados. O cliente não escolhe a empresa: ela vem da sessão e do vínculo ativo no shared. SQL parametrizado, permissões por área, papel `erp_runtime` e RLS são reutilizados do ERP. Não há alteração de dados nesses endpoints.

`from`/`to` são inclusivos e limitados a 366 dias. Sem datas, o resumo usa início do mês até hoje. Comparações de meses completos usam o mês anterior completo; outros períodos comparam a mesma quantidade de dias imediatamente anteriores. Base anterior zero mostra “Sem base de comparação”. Valores de posição atual não recebem comparação histórica.

Data de referência e exibição: `America/Fortaleza`. Snapshots atuais permanecem atuais ao mudar o período. Cada resposta executa em transação `REPEATABLE READ READ ONLY`; todos os indicadores dessa resposta enxergam o mesmo snapshot. HTTP usa `Cache-Control: no-store`. Não há cache compartilhado entre empresas.

## Critérios dos indicadores

| Dashboard | Critérios |
| --- | --- |
| Visão geral | Reutiliza as consultas das áreas permitidas. Não consulta finanças, compras ou estoque quando o usuário não tem acesso. |
| Financeiro | Parcelas com saldo positivo, excluindo pagas/canceladas/renegociadas. Período pela data de vencimento. Vencidas: vencimento anterior à referência. Próximos 7 dias: referência até referência + 7, inclusive. Previsões somente com opção habilitada. |
| Vendas | Tipo `venda`, status confirmada/faturada, data da venda. Exclui pedidos, rascunhos, canceladas e orçamentos do faturamento comercial. Ticket = valor/quantidade. Conversão = orçamentos do período vinculados a vendas confirmadas até a consulta / orçamentos não cancelados do período. |
| Compras | Tipo `compra`, status confirmada/parcialmente_recebida/recebida, data da compra. O valor integral do pedido compõe o indicador; recebimento parcial é separado. |
| Estoque | Posição atual de produto/local. Valor = físico × custo médio. Disponível = físico − reservado. Reposição compara disponibilidade somada nos locais com o mínimo do produto. Movimentos usam data operacional, com data de ocorrência como fallback; contam movimentos, sem somar unidades de produtos diferentes. |
| Resultados | Critério de caixa, pela data do pagamento ou estorno. Usa valor líquido e rateios existentes com ajuste de centavos. Resultado = recebimentos − pagamentos. Adiantamentos e transferências internas não compõem este resultado. |
| Serviços | Ordens abertas/atrasadas na posição atual; concluídas pela data de conclusão. Contratos ativos com a última versão efetivada e vigente na referência. Valor mensal somente de contratos mensais, sem duplicar versões. |

Saldo financeiro: saldo inicial de cada conta + pagamentos/estornos + adiantamentos + transferências concluídas, entre sua data inicial e a referência. A transferência afeta as duas contas, mas não constitui receita/despesa. Contas não excluídas, inclusive inativas com saldo, estão incluídas.

Projeção: saldo atual + saldo das parcelas por vencimento nos próximos 30 dias + movimentos futuros já registrados. Atrasados são apresentados como pendência; não são colocados automaticamente como entrada hoje. Não estima encargos futuros. Isso é uma previsão pelas datas contratuais, não uma garantia de recebimento.

Rankings mostram até 8 grupos. Produtos/serviços de vendas distribuem desconto/despesas do documento proporcionalmente aos itens. A conferência de um item mostra somente sua contribuição em cada venda. Valores negativos em categorias/centros representam saídas líquidas, não erros de sinal.

## Conferência dos registros

Os links levam a `/erp/dashboards/[dashboardId]/registros`, com os mesmos critérios de confirmação, vencimento, saldo e previsão. Rankings acrescentam cliente, vendedor, fornecedor, produto, serviço, categoria, centro ou local; pendências acrescentam o registro. A tabela mostra total de toda a consulta, separado da paginação.

A Visão geral inclui resultado pelo caixa somente com as duas capacidades `erp.financeiro.visualizar` e `erp.relatorios.visualizar`. Inclui também ordens atrasadas, ranking de clientes e até cinco parcelas a pagar com saldo nos próximos sete dias; estas parcelas são calculadas com pagamentos, créditos e renegociações, identificadas por data e situação. A opção de previsões é respeitada. A nova consulta usa o mesmo snapshot de leitura e o mesmo contexto de empresa dos demais indicadores. Seus links carregam o ID da parcela para que a conferência não traga títulos diferentes.

Fontes autorizadas são uma lista fixa no contrato. Um usuário com acesso comercial não pode obter parcelas financeiras através do resumo. Períodos de estoque/contas atuais não são simulados como posições históricas.

## Verificação

- `node node_modules/typescript/bin/tsc --noEmit -p tsconfig.erp.json --pretty false`
- `node node_modules/tsx/dist/cli.mjs scripts/erp/dashboards-smoke.ts`: sete consultas reais, totais independentes, reconciliação de indicadores/rankings com seus registros, permissões, períodos vazios, previsões, compras parciais e impressão digital das tabelas das duas empresas antes/depois.
- `node scripts/erp/dashboards-http-smoke.mjs`: HTTP real e SQL no Supabase; sessão externa substituída somente no teste local. Valida 401/403/404/422, paginação e headers. Não é um teste de login real do Clerk/ChatGPT.
- `node scripts/erp/api-catalog.mjs`: verifica inventário de rotas e separação entre HTTP e SQL.

Evidências ficam em `.cache/dashboards/`, ignorada pelo Git. Os testes não criam, editam ou excluem registros de negócio. Não é necessária uma nova tabela ou migration para os dashboards.
