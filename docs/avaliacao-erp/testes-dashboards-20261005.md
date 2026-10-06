# Conferência dos dashboards no Supabase — 05/10/2026

## Resultado

**Os sete dashboards passaram nos cenários executados, sem divergência nos valores conferidos.** Teste somente de leitura, com a empresa 2 (Igor Bianch Workspace) e identidade do usuário 3.

- 23 verificações de consultas, filtros, comparação, permissões e preservação.
- 103 consultas dos registros associados aos indicadores e rankings, com totais reconciliados.
- 36 verificações dos endpoints HTTP, incluindo 401/403/404/422, paginação e cabeçalhos.
- 42 comparações independentes: registros brutos do banco calculados em JavaScript, sem reutilizar SQL dos dashboards ou dos registros de conferência.

## Valores conferidos

Período dos indicadores de movimento: **01/09/2026 a 30/09/2026**. Posições atuais: **05/10/2026**, em `America/Fortaleza`.

| Dashboard | Exemplos conferidos |
| --- | --- |
| Visão geral | Todos os oito indicadores iguais aos respectivos dashboards de origem |
| Financeiro | Saldo atual R$ 178.131,55; a receber no período R$ 15.260,55; a pagar no período R$ 24.388,03 |
| Vendas | 39 vendas confirmadas/faturadas, R$ 87.123,74; ticket médio R$ 2.233,94 |
| Compras | 17 compras confirmadas/recebidas, R$ 65.734,00; duas aguardando recebimento |
| Estoque | 20 produtos; valor atual R$ 273.969,20; dois produtos para repor; sete posições com reservas |
| Resultados | Recebimentos R$ 55.508,29; pagamentos R$ 70.735,18; resultado pelo caixa −R$ 15.226,89 |
| Serviços e contratos | Quatro ordens abertas; duas atrasadas; cinco concluídas no período; 12 contratos ativos; valor mensal R$ 15.120,00 |

Também foram conferidos: vencidos a receber R$ 39.200,07; vencidos a pagar R$ 34.461,67; contas a pagar de 05/10 a 12/10, inclusive, R$ 24.000,10; entradas e saídas de estoque no período (20 e 18 movimentos), orçamentos, conversão e comparações comerciais com agosto.

Valores monetários nesta tabela estão arredondados para apresentação. O valor bruto do estoque retornado é `273969.199017`, decorrente de quantidade × custo médio; o teste compara o resultado sem arredondá-lo previamente.

## Como a correção foi conferida

- Financeiro: parcelas e títulos brutos; pagamentos válidos; aplicações/reversões de adiantamentos; renegociações efetivadas. Saldo das contas calculado com saldo inicial, pagamentos/estornos, adiantamentos e transferências.
- Vendas e compras: documentos não excluídos, tipos/status previstos nas fórmulas e datas do período; contagens, valores e comparação anterior. Vendas em rascunho não entram no faturamento comercial.
- Estoque: posições por produto/local; disponibilidade física menos reservada; custo médio; mínimo de reposição; movimentos pela data operacional.
- Serviços: status e conclusão das ordens; contrato ativo e versão efetivada vigente, sem duplicar versões. Valor mensal limitado à periodicidade mensal.
- Resultados: pagamentos líquidos e estornos no período; resultado também conciliado com o relatório de caixa existente.
- Indicadores e rankings: conferência com seus registros paginados, usando o total de toda a consulta.

O teste de leitura verificou ainda período vazio, ausência de base anterior, comparação desligada, opção de previsões, compras parcialmente recebidas e rejeição de filtros inválidos. As impressões digitais das tabelas com registros das empresas 1 e 2 permaneceram iguais antes/depois (45 tabelas presentes nesse resultado; tabelas vazias não geram grupos).

## Alcance

Os sete dashboards usam os endpoints da API do ERP e não são sete ferramentas dedicadas do MCP. Esta validação executou os serviços/handlers reais com SQL no Supabase real, por HTTP local. A sessão externa do Clerk foi substituída no ambiente local de teste após conferir o vínculo ativo entre usuário e empresa.

Não foram testados nesta execução o login real no ChatGPT, OAuth, o frontend ou o ambiente publicado. A ferramenta MCP `analisar_periodo` e `resumo_erp` não foram chamadas neste teste específico. Não houve criação, atualização ou exclusão de registros de negócio, nem publicação de nova versão.

## Repetição e evidências

Executar a conferência independente logo após a leitura, com o banco sem alterações entre as duas etapas:

```text
node node_modules/tsx/dist/cli.mjs scripts/erp/dashboards-smoke.ts
node scripts/erp/dashboards-reconcile.mjs
node scripts/erp/dashboards-http-smoke.mjs
```

O segundo script exige evidência aprovada gerada há menos de dez minutos e usa transação `REPEATABLE READ READ ONLY` para suas consultas.

Relatórios locais ignorados pelo Git:

- `.cache/dashboards/read-smoke.json`
- `.cache/dashboards/reconcile-smoke.json`
- `.cache/dashboards/http-smoke.json`

O script novo de conferência é `scripts/erp/dashboards-reconcile.mjs`. Nenhuma correção nos dashboards foi necessária para os cenários testados.
