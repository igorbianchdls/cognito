# ERP Skill (Contrato de Dados)

Objetivo: mapear corretamente `model`, `measure`, `dimension`, `filters` para dominio ERP.

Este skill NAO gera JSONR final de dashboard.
Para gerar dashboard final, use a tool `dashboard_builder`.

## Fronteira

Este skill define:
- tabelas/models
- metricas
- dimensoes
- filtros
- exemplos de `dataQuery`

Este skill NAO define:
- `Theme`, `Header`, `Div`, `KPI`, charts, `SlicerCard`, `AISummary`
- layout visual final (pode sugerir leituras analiticas em KPI/chart sem impor estrutura)
- arquivo final `.jsonr`

## Fontes de Verdade

- `src/products/bi/shared/queryCatalog.ts`
- `GET /api/modulos/query/catalog`
- controllers de query do modulo ERP

Se houver divergencia, priorizar o controller do modulo.

## Models Principais

- `vendas.pedidos`
- `compras.compras`
- `compras.recebimentos`
- `financeiro.contas_pagar`
- `financeiro.contas_receber`
- `contabilidade.lancamentos_contabeis`
- `contabilidade.lancamentos_contabeis_linhas`
- `crm.oportunidades`
- `crm.leads`
- `estoque.estoques_atual`
- `estoque.movimentacoes`

## Referencia Real de Templates (ERP Vendas)

Base atual observada em:
- `src/products/bi/shared/templates/appsVendasTemplate.ts`

Dimensoes mais usadas em vendas:
- `canal_venda`
- `categoria_receita`
- `cliente`
- `vendedor`
- `filial`
- `unidade_negocio`
- `territorio`
- `mes`

Medidas mais usadas em vendas:
- `SUM(p.valor_total)`
- `COUNT()`
- `AVG(p.valor_total)`
- `SUM(itens.subtotal)`
- `AVG(valor_total)`

## Sugestoes Analiticas (Nao Obrigatorio; nao e contrato de layout)

### Dashboard de Vendas (recomendado)

KPIs sugeridos:
- `vendas.pedidos` + `SUM(p.valor_total)`
- `vendas.pedidos` + `COUNT()`
- `vendas.pedidos` + `AVG(p.valor_total)`
- `valuePath: vendas.kpis.margemBruta` (quando disponivel no payload)

Graficos sugeridos:
- `LineChart`: model `vendas.pedidos`, dimension `mes`, dimensionExpr `TO_CHAR(DATE_TRUNC('month', data_pedido), 'YYYY-MM')`, measure `SUM(itens.subtotal)`
- `BarChart`: model `vendas.pedidos`, dimension `mes`, dimensionExpr `TO_CHAR(DATE_TRUNC('month', data_pedido), 'YYYY-MM')`, measure `COUNT()`
- `BarChart`: model `vendas.pedidos`, dimension `mes`, dimensionExpr `TO_CHAR(DATE_TRUNC('month', data_pedido), 'YYYY-MM')`, measure `AVG(valor_total)`
- `BarChart`: model `vendas.pedidos`, dimension `vendedor`, measure `SUM(itens.subtotal)`
- `BarChart`: model `vendas.pedidos`, dimension `cliente`, measure `SUM(itens.subtotal)`
- `PieChart`: model `vendas.pedidos`, dimension `canal_venda`, measure `SUM(itens.subtotal)`
- `BarChart`: model `vendas.pedidos`, dimension `categoria_receita`, measure `SUM(itens.subtotal)`
- `BarChart`: model `vendas.pedidos`, dimension `filial`, measure `SUM(itens.subtotal)`
- `BarChart`: model `vendas.pedidos`, dimension `unidade_negocio`, measure `SUM(itens.subtotal)`
- `BarChart`: model `vendas.pedidos`, dimension `territorio`, measure `SUM(itens.subtotal)`

Observacao de composicao:
- para ficar parecido com os apps atuais, usar multiplos KPIs e multiplos graficos;
- filtros podem ficar no fim do dashboard (preferencia de leitura executiva).

## Mapeamentos Canonicos (exemplos `dataQuery`)

Receita de vendas:
```json
{
  "model": "vendas.pedidos",
  "measure": "SUM(p.valor_total)",
  "filters": {}
}
```

Pedidos por vendedor:
```json
{
  "model": "vendas.pedidos",
  "dimension": "vendedor",
  "measure": "COUNT()",
  "filters": {},
  "orderBy": { "field": "measure", "dir": "desc" },
  "limit": 10
}
```

Compras por fornecedor:
```json
{
  "model": "compras.compras",
  "dimension": "fornecedor",
  "measure": "SUM(valor_total)",
  "filters": { "status": "aprovado" },
  "orderBy": { "field": "measure", "dir": "desc" },
  "limit": 10
}
```

Contas a receber por mes:
```json
{
  "model": "financeiro.contas_receber",
  "dimension": "mes",
  "measure": "SUM(valor)",
  "filters": {},
  "orderBy": { "field": "dimension", "dir": "asc" },
  "limit": 12
}
```

Pipeline CRM por fase:
```json
{
  "model": "crm.oportunidades",
  "dimension": "fase",
  "measure": "SUM(valor_estimado)",
  "filters": { "status": "aberta" },
  "orderBy": { "field": "measure", "dir": "desc" }
}
```

Estoque por produto:
```json
{
  "model": "estoque.estoques_atual",
  "dimension": "produto",
  "measure": "SUM(valor_total)",
  "filters": {},
  "orderBy": { "field": "measure", "dir": "desc" },
  "limit": 20
}
```

## Regras Operacionais

- Nao inventar `model/measure/dimension/filter` fora da whitelist.
- Nao misturar granularidade sem explicitar (ex.: pedido vs item).
- Quando campo pedido pelo usuario nao existir, usar o mais proximo suportado e explicar o ajuste.

## Formato de Handoff para Dashboard Builder

Ao terminar, entregar um plano de dados enxuto para consumo da `dashboard_builder`:

```json
{
  "dashboard_name": "<nome>",
  "widgets_sugeridos": [
    {
      "widget_id": "kpi_receita",
      "widget_type": "kpi",
      "container": "principal",
      "payload": {
        "title": "Receita",
        "tabela": "vendas.pedidos",
        "medida": "SUM(p.valor_total)",
        "filtros": {}
      }
    }
  ],
  "filtros_sugeridos": ["dateRange", "filial_id", "vendedor_id"]
}
```

Regra obrigatoria:
- nunca sugerir `/vercel/sandbox/dashboards` (plural)
