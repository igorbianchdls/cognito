# Ecommerce Skill (Contrato de Dados Multicanal)

Objetivo: mapear dados de ecommerce para `dataQuery` de forma consistente, sem inventar schema.

Este skill NAO gera JSONR final.
Para dashboard final, usar `dashboard.md`.

## Fronteira

Este skill define:
- models por dominio
- medidas
- dimensoes
- filtros
- options
- exemplos de `dataQuery`

Este skill NAO define layout visual.

## Fontes de Verdade

- `src/products/erp/backend/features/modulos/controllers/ecommerce/query/controller.ts`
- `src/products/erp/backend/features/modulos/controllers/ecommerce/options/controller.ts`
- `src/products/bi/shared/queryCatalog.ts`
- `tmp/ecommerce_mvp_schema.sql`

Prioridade em conflito:
1. controller de query/options
2. query catalog
3. schema sql

## Models Principais (BI)

- `ecommerce.pedidos`
- `ecommerce.pedido_itens`
- `ecommerce.pagamentos`
- `ecommerce.envios`
- `ecommerce.taxas_pedido`
- `ecommerce.payouts`
- `ecommerce.estoque_saldos`

## Medidas Canonicas

- `SUM(valor_total)` (GMV)
- `COUNT()`
- `AVG(valor_total)` (ticket medio)
- `SUM(valor_liquido_estimado)`
- `SUM(valor_reembolsado)`
- `SUM(taxa_total)`
- `CASE WHEN SUM(valor_total)=0 THEN 0 ELSE SUM(taxa_total)/SUM(valor_total) END` (fee rate)
- `SUM(valor_liquido)`
- `SUM(quantidade_disponivel)`

## Dimensoes Canonicas

- `plataforma`
- `canal_conta`
- `loja`
- `status`
- `status_pagamento`
- `status_fulfillment`
- `produto`
- `categoria`
- `transportadora`
- `mes`, `periodo`

## Filtros Canonicos

- `tenant_id`
- `de`, `ate`
- `plataforma`
- `canal_conta_id`
- `loja_id`
- `status`
- `status_pagamento`
- `status_fulfillment`
- `produto_id`
- `categoria`
- `valor_min`, `valor_max`

## Options de Slicer

- `plataforma`
- `canal_conta_id`
- `loja_id`
- `status`
- `status_pagamento`
- `status_fulfillment`
- `produto_id`
- `categoria`

## Mapeamentos Canonicos (exemplos `dataQuery`)

GMV total:
```json
{
  "model": "ecommerce.pedidos",
  "measure": "SUM(valor_total)",
  "filters": {}
}
```

Pedidos por plataforma:
```json
{
  "model": "ecommerce.pedidos",
  "dimension": "plataforma",
  "measure": "COUNT()",
  "filters": {},
  "orderBy": { "field": "measure", "dir": "desc" }
}
```

Ticket medio por mes:
```json
{
  "model": "ecommerce.pedidos",
  "dimension": "mes",
  "measure": "AVG(valor_total)",
  "filters": {},
  "orderBy": { "field": "dimension", "dir": "asc" },
  "limit": 12
}
```

Taxa sobre GMV:
```json
{
  "model": "ecommerce.taxas_pedido",
  "measure": "CASE WHEN SUM(valor_total)=0 THEN 0 ELSE SUM(taxa_total)/SUM(valor_total) END",
  "filters": {}
}
```

Payout por plataforma:
```json
{
  "model": "ecommerce.payouts",
  "dimension": "plataforma",
  "measure": "SUM(valor_liquido)",
  "filters": {},
  "orderBy": { "field": "measure", "dir": "desc" }
}
```

Estoque por produto:
```json
{
  "model": "ecommerce.estoque_saldos",
  "dimension": "produto",
  "measure": "SUM(quantidade_disponivel)",
  "filters": {},
  "orderBy": { "field": "measure", "dir": "desc" },
  "limit": 20
}
```

## Regras Operacionais

- Nao misturar granularidade sem declarar (pedido vs item vs pagamento vs payout).
- Nao inventar `model/measure/dimension/filter` fora da whitelist.
- Quando campo nao existir, usar alternativa suportada e explicar.

## Formato de Handoff para Dashboard Skill

```json
{
  "targetPath": "/vercel/sandbox/dashboard/<nome>.jsonr",
  "queries": [
    {
      "id": "kpi_gmv",
      "title": "GMV",
      "dataQuery": {
        "model": "ecommerce.pedidos",
        "measure": "SUM(valor_total)",
        "filters": {}
      }
    }
  ],
  "slicerOptions": ["plataforma", "canal_conta_id", "loja_id", "status"]
}
```

Regra obrigatoria:
- nunca sugerir `/vercel/sandbox/dashboards` (plural)
