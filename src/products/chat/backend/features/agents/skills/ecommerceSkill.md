# Ecommerce Skill (SQL Query-First)

Objetivo: definir SQL valido para dashboards ecommerce (Amazon, Shopee, ML, Shopify etc.) usando `dataQuery.query`.

Este skill NAO gera JSONR final.
Para estrutura final, usar `dashboard_builder`.

## Contrato de Dados

Padrao principal em KPI/Chart: `query` puro.

- KPI: `query` (+ `yField` opcional).
- Chart: `query`, `xField`, `yField` (`keyField` opcional).
- Formato legado com `model/measure/dimension` e fallback tecnico, nao padrao.

## Fontes de Verdade

- `src/products/erp/backend/features/modulos/controllers/ecommerce/query/controller.ts`
- `src/products/erp/backend/features/modulos/controllers/ecommerce/options/controller.ts`
- `src/products/bi/shared/queryCatalog.ts`
- Templates em `src/products/bi/shared/templates/apps*Template.ts`

Em conflito, priorizar controller do modulo.

## Tabelas Mais Comuns

- `ecommerce.pedidos`
- `ecommerce.pedido_itens`
- `ecommerce.pagamentos`
- `ecommerce.envios`
- `ecommerce.taxas_pedido`
- `ecommerce.payouts`
- `ecommerce.estoque_saldos`

## Campos de Corte Comuns

- `plataforma`
- `canal_conta_id`
- `loja_id`
- `status`
- `status_pagamento`
- `status_fulfillment`
- `produto_id`
- `categoria`
- `transportadora`
- `data_pedido` / `mes`

## Filtros Canonicos

- `{{tenant_id}}`
- `{{de}}`, `{{ate}}`
- `{{plataforma}}`
- `{{canal_conta_id}}`
- `{{loja_id}}`
- `{{status}}`
- `{{status_pagamento}}`
- `{{status_fulfillment}}`
- `{{produto_id}}`
- `{{categoria}}`

## Padroes SQL Recomendados

Base temporal:

```sql
WHERE src.tenant_id = {{tenant_id}}::int
  AND ({{de}}::date IS NULL OR src.data_pedido::date >= {{de}}::date)
  AND ({{ate}}::date IS NULL OR src.data_pedido::date <= {{ate}}::date)
```

Filtro opcional texto:

```sql
AND ({{plataforma}}::text IS NULL OR src.plataforma = {{plataforma}}::text)
```

Filtro opcional id:

```sql
AND ({{loja_id}}::int IS NULL OR src.loja_id = {{loja_id}}::int)
```

## Exemplo KPI (GMV)

```sql
SELECT COALESCE(SUM(src.valor_total), 0)::float AS value
FROM ecommerce.pedidos src
WHERE src.tenant_id = {{tenant_id}}::int
  AND ({{de}}::date IS NULL OR src.data_pedido::date >= {{de}}::date)
  AND ({{ate}}::date IS NULL OR src.data_pedido::date <= {{ate}}::date)
```

## Exemplo Chart (Canais)

```sql
SELECT
  cc.id AS key,
  COALESCE(cc.nome, '-') AS label,
  COALESCE(SUM(src.valor_total), 0)::float AS value
FROM ecommerce.pedidos src
LEFT JOIN ecommerce.canais_conta cc ON cc.id = src.canal_conta_id
WHERE src.tenant_id = {{tenant_id}}::int
  AND ({{de}}::date IS NULL OR src.data_pedido::date >= {{de}}::date)
  AND ({{ate}}::date IS NULL OR src.data_pedido::date <= {{ate}}::date)
GROUP BY 1,2
ORDER BY 3 DESC
```

## Exemplo Serie Mensal

```sql
SELECT
  TO_CHAR(DATE_TRUNC('month', src.data_pedido), 'YYYY-MM') AS key,
  TO_CHAR(DATE_TRUNC('month', src.data_pedido), 'YYYY-MM') AS label,
  COALESCE(SUM(src.valor_total), 0)::float AS value
FROM ecommerce.pedidos src
WHERE src.tenant_id = {{tenant_id}}::int
  AND ({{de}}::date IS NULL OR src.data_pedido::date >= {{de}}::date)
  AND ({{ate}}::date IS NULL OR src.data_pedido::date <= {{ate}}::date)
GROUP BY 1,2
ORDER BY 2 ASC
```

## Regras Operacionais

- Nao inventar colunas inexistentes (ex.: `src.mes`, `src.produto`, `src.loja` sem validar).
- Quando precisar de `produto`/`categoria`, usar `ecommerce.pedido_itens` ou join com tabela correta.
- Nao usar `to_jsonb(src)->>'campo'` se a coluna existe.
- Evitar joins desnecessarios.

## Handoff para dashboard_builder

```json
{
  "widget_type": "chart",
  "payload": {
    "title": "Pedidos por Status",
    "chart_type": "bar",
    "query": "SELECT ...",
    "xField": "label",
    "yField": "value",
    "keyField": "key",
    "formato": "number"
  }
}
```
