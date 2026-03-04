# Ecommerce Skill (SQL Query-First)

Objetivo: definir SQL valido para dashboards de ecommerce (Amazon, Shopee, Mercado Livre, Shopify etc.) usando `dataQuery.query`.

Este skill NAO gera JSONR final.
Para montagem final de dashboard/layout, usar `dashboard_builder`.

## Fontes de Verdade

Prioridade de referencia:
1. `src/products/erp/backend/features/modulos/controllers/ecommerce/query/controller.ts`
2. `src/products/erp/backend/features/modulos/controllers/ecommerce/options/controller.ts`
3. `src/products/bi/shared/queryCatalog.ts`

Em conflito, priorizar controller.

## Contrato Query-First

- KPI: `query` retornando `value`
- Chart: `query`, `xField`, `yField` (`keyField` recomendado)
- Evitar formato legado (`model/measure/dimension`) em novos templates

## Modelos Canonicos (Schema/Tabela/Colunas)

### `ecommerce.pedidos`
Colunas base (confirmadas em controller/catalog):
- `id`, `tenant_id`, `data_pedido`
- `plataforma`, `canal_conta_id`, `loja_id`, `cliente_id`
- `status`, `status_pagamento`, `status_fulfillment`
- `valor_total`, `valor_pago`, `valor_reembolsado`, `valor_liquido_estimado`
- `frete_total`, `desconto_total`, `taxa_total`

Joins comuns:
- `ecommerce.canais_contas cc`
- `ecommerce.lojas l`
- `ecommerce.clientes c`

### `ecommerce.pedido_itens`
Colunas base:
- `id`, `tenant_id`, `pedido_id`
- `produto_id`, `produto_variante_id`
- `titulo_item`, `sku`, `status`
- `quantidade`, `preco_unitario`, `valor_total`
- `created_at`

Joins comuns:
- `ecommerce.pedidos p`
- `ecommerce.produtos pr`
- `ecommerce.produto_variantes pv`

### `ecommerce.pagamentos` (suportado no controller)
Colunas base:
- `id`, `tenant_id`, `pedido_id`
- `status`, `metodo`, `provedor`
- `valor_autorizado`, `valor_capturado`, `valor_taxa`, `valor_liquido`
- `data_autorizacao`, `data_captura`

### `ecommerce.envios`
Colunas base:
- `id`, `tenant_id`, `pedido_id`
- `status`, `transportadora`
- `frete_cobrado`, `frete_custo`
- `despachado_em`, `entregue_em`

### `ecommerce.taxas_pedido`
Colunas base:
- `id`, `tenant_id`, `pedido_id`
- `tipo_taxa`, `valor`, `competencia_em`

### `ecommerce.payouts`
Colunas base:
- `id`, `tenant_id`
- `plataforma`, `canal_conta_id`, `loja_id`, `status`
- `valor_bruto`, `valor_liquido`
- `periodo_inicio`, `periodo_fim`, `data_pagamento`

### `ecommerce.estoque_saldos`
Colunas base:
- `id`, `tenant_id`
- `plataforma`, `canal_conta_id`, `loja_id`, `produto_id`, `status`
- `quantidade_disponivel`, `quantidade_total`
- `snapshot_date`
- `capturado_em`, `source_updated_at`, `created_at` (usados em contexto de serie temporal no controller)

## Filtros Canonicos

Mais usados:
- `{{tenant_id}}`
- `{{de}}`, `{{ate}}`
- `{{plataforma}}`
- `{{canal_conta_id}}`
- `{{loja_id}}`
- `{{status}}`, `{{status_pagamento}}`, `{{status_fulfillment}}`
- `{{produto_id}}`, `{{categoria}}`

Padrao de data:

```sql
AND ({{de}}::date IS NULL OR src.data_base::date >= {{de}}::date)
AND ({{ate}}::date IS NULL OR src.data_base::date <= {{ate}}::date)
```

Padrao de filtro opcional:

```sql
AND ({{loja_id}}::int IS NULL OR src.loja_id = {{loja_id}}::int)
```

## KPIs Canonicos

### GMV
```sql
SELECT COALESCE(SUM(p.valor_total), 0)::float AS value
FROM ecommerce.pedidos p
WHERE p.tenant_id = {{tenant_id}}::int
  AND ({{de}}::date IS NULL OR p.data_pedido::date >= {{de}}::date)
  AND ({{ate}}::date IS NULL OR p.data_pedido::date <= {{ate}}::date)
```

### Pedidos
```sql
SELECT COUNT(*)::int AS value
FROM ecommerce.pedidos p
WHERE p.tenant_id = {{tenant_id}}::int
  AND ({{de}}::date IS NULL OR p.data_pedido::date >= {{de}}::date)
  AND ({{ate}}::date IS NULL OR p.data_pedido::date <= {{ate}}::date)
```

### Ticket medio
```sql
SELECT COALESCE(AVG(p.valor_total), 0)::float AS value
FROM ecommerce.pedidos p
WHERE p.tenant_id = {{tenant_id}}::int
  AND ({{de}}::date IS NULL OR p.data_pedido::date >= {{de}}::date)
  AND ({{ate}}::date IS NULL OR p.data_pedido::date <= {{ate}}::date)
```

### Receita liquida estimada
```sql
SELECT COALESCE(SUM(p.valor_liquido_estimado), 0)::float AS value
FROM ecommerce.pedidos p
WHERE p.tenant_id = {{tenant_id}}::int
  AND ({{de}}::date IS NULL OR p.data_pedido::date >= {{de}}::date)
  AND ({{ate}}::date IS NULL OR p.data_pedido::date <= {{ate}}::date)
```

### Fee rate
```sql
SELECT
  CASE
    WHEN COALESCE(SUM(p.valor_total), 0) = 0 THEN 0
    ELSE COALESCE(SUM(p.taxa_total), 0)::float / NULLIF(SUM(p.valor_total), 0)::float
  END::float AS value
FROM ecommerce.pedidos p
WHERE p.tenant_id = {{tenant_id}}::int
  AND ({{de}}::date IS NULL OR p.data_pedido::date >= {{de}}::date)
  AND ({{ate}}::date IS NULL OR p.data_pedido::date <= {{ate}}::date)
```

## Graficos Canonicos

### GMV por mes (line)
```sql
SELECT
  TO_CHAR(DATE_TRUNC('month', p.data_pedido), 'YYYY-MM') AS key,
  TO_CHAR(DATE_TRUNC('month', p.data_pedido), 'YYYY-MM') AS label,
  COALESCE(SUM(p.valor_total), 0)::float AS value
FROM ecommerce.pedidos p
WHERE p.tenant_id = {{tenant_id}}::int
  AND ({{de}}::date IS NULL OR p.data_pedido::date >= {{de}}::date)
  AND ({{ate}}::date IS NULL OR p.data_pedido::date <= {{ate}}::date)
GROUP BY 1,2
ORDER BY 2 ASC
```

### Pedidos por status (bar)
```sql
SELECT
  COALESCE(p.status, '-') AS key,
  COALESCE(p.status, '-') AS label,
  COUNT(*)::int AS value
FROM ecommerce.pedidos p
WHERE p.tenant_id = {{tenant_id}}::int
  AND ({{de}}::date IS NULL OR p.data_pedido::date >= {{de}}::date)
  AND ({{ate}}::date IS NULL OR p.data_pedido::date <= {{ate}}::date)
GROUP BY 1,2
ORDER BY 3 DESC
```

### Top produtos (bar)
```sql
SELECT
  pi.produto_id AS key,
  COALESCE(pr.nome, pi.titulo_item, CONCAT('Produto #', pi.produto_id::text)) AS label,
  COALESCE(SUM(pi.valor_total), 0)::float AS value
FROM ecommerce.pedido_itens pi
LEFT JOIN ecommerce.pedidos p ON p.id = pi.pedido_id
LEFT JOIN ecommerce.produtos pr ON pr.id = pi.produto_id
WHERE pi.tenant_id = {{tenant_id}}::int
  AND ({{de}}::date IS NULL OR p.data_pedido::date >= {{de}}::date)
  AND ({{ate}}::date IS NULL OR p.data_pedido::date <= {{ate}}::date)
GROUP BY 1,2
ORDER BY 3 DESC
LIMIT 10
```

### Taxas por tipo (bar)
```sql
SELECT
  COALESCE(t.tipo_taxa, '-') AS key,
  COALESCE(t.tipo_taxa, '-') AS label,
  COALESCE(SUM(t.valor), 0)::float AS value
FROM ecommerce.taxas_pedido t
LEFT JOIN ecommerce.pedidos p ON p.id = t.pedido_id
WHERE t.tenant_id = {{tenant_id}}::int
  AND ({{de}}::date IS NULL OR COALESCE(t.competencia_em, p.data_pedido)::date >= {{de}}::date)
  AND ({{ate}}::date IS NULL OR COALESCE(t.competencia_em, p.data_pedido)::date <= {{ate}}::date)
GROUP BY 1,2
ORDER BY 3 DESC
```

### Envios por transportadora (bar)
```sql
SELECT
  COALESCE(e.transportadora, '-') AS key,
  COALESCE(e.transportadora, '-') AS label,
  COUNT(*)::int AS value
FROM ecommerce.envios e
LEFT JOIN ecommerce.pedidos p ON p.id = e.pedido_id
WHERE e.tenant_id = {{tenant_id}}::int
  AND ({{de}}::date IS NULL OR COALESCE(e.despachado_em, p.data_pedido)::date >= {{de}}::date)
  AND ({{ate}}::date IS NULL OR COALESCE(e.despachado_em, p.data_pedido)::date <= {{ate}}::date)
GROUP BY 1,2
ORDER BY 3 DESC
```

## Regras Anti-Erro (obrigatorias)

- Usar `ecommerce.canais_contas` (plural), nao `canais_conta`.
- `mes`/`periodo` sao dimensoes derivadas com `DATE_TRUNC` + `TO_CHAR`; nao existe `src.mes` fisico.
- `produto` nao eh coluna fisica de `ecommerce.pedidos`; usar `ecommerce.pedido_itens` + `ecommerce.produtos`.
- `loja` label vem de join (`ecommerce.lojas`); coluna fisica no pedido eh `loja_id`.
- Evitar `to_jsonb(src)->>'campo'` quando a coluna existe.
- Nao adicionar joins nao usados em `SELECT/WHERE/GROUP BY`.
- Para taxas/percentuais, proteger divisor com `NULLIF` ou `CASE`.

## Handoff para `dashboard_builder`

```json
{
  "widget_type": "chart",
  "payload": {
    "title": "Top Produtos",
    "chart_type": "bar",
    "query": "SELECT ...",
    "xField": "label",
    "yField": "value",
    "keyField": "key",
    "formato": "currency"
  }
}
```
