# ERP Skill (Contrato de Dados)

Objetivo: mapear corretamente `model`, `measure`, `dimension`, `filters` para dominio ERP.

Este skill NAO gera JSONR final de dashboard.
Para gerar dashboard, handoff obrigatorio para `dashboard.md`.

## Fronteira

Este skill define:
- tabelas/models
- metricas
- dimensoes
- filtros
- exemplos de `dataQuery`

Este skill NAO define:
- `Theme`, `Header`, `Div`, `KPI`, charts, `SlicerCard`, `AISummary`
- layout visual
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

## Formato de Handoff para Dashboard Skill

Ao terminar, entregar um plano de dados enxuto para `dashboard.md`:

```json
{
  "targetPath": "/vercel/sandbox/dashboard/<nome>.jsonr",
  "queries": [
    {
      "id": "kpi_receita",
      "title": "Receita",
      "dataQuery": {
        "model": "vendas.pedidos",
        "measure": "SUM(p.valor_total)",
        "filters": {}
      }
    }
  ],
  "filters": ["dateRange", "filial_id", "vendedor_id"]
}
```

Regra obrigatoria:
- nunca sugerir `/vercel/sandbox/dashboards` (plural)
