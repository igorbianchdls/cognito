# Ecommerce Skill (SQL Query-First)

Objetivo: definir SQL valido para dashboards de ecommerce (Amazon, Shopee, Mercado Livre, Shopify etc.) usando `dataQuery.query`.

Este skill NAO gera DSL final.
Para montagem final de dashboard/layout, usar `dashboard_builder`.

## Fontes de Verdade

Prioridade de referencia:
1. `src/products/erp/backend/features/modulos/controllers/ecommerce/query/controller.ts`
2. `src/products/erp/backend/features/modulos/controllers/ecommerce/options/controller.ts`
3. `src/products/bi/shared/queryCatalog.ts`

Em conflito, priorizar controller.

## Sugestao de Estrutura (baseada no template /apps/shopify)

- Use este baseline ao montar plano no `dashboard_builder`.
- Ajuste apenas quando o usuario pedir layout diferente.
- Topo: 1 row de filtros principais (ex.: canal, loja, status).
- KPI row 1: 6 KPIs comerciais (GMV, Pedidos, Ticket Medio, Clientes Unicos, Receita Liquida Est., Reembolsos).
- KPI row 2: 6 KPIs operacionais/financeiros (Taxas, Fee Rate, Payout Liquido, Envios, Frete Custo, Estoque).
- Graficos abaixo: multiplas rows com foco em tendencia, distribuicao/ranking e operacao:
- Row A: GMV por Mes + Pedidos por Status + GMV por Conta.
- Row B: GMV por Loja + Receita Liquida por Mes + Status de Pagamento.
- Row C: Top Produtos (receita/quantidade) + Taxas por Tipo.
- Row D: Payout por Mes + Envios por Transportadora + Estoque por Mes.
- Regra pratica: ecommerce usa 2 rows de KPI e multiplos blocos de graficos abaixo (nao comprimir em 1-2 rows).

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

## Queries de Exploracao (para `sql_execution`)

Estas queries sao para investigacao ad-hoc e diagnostico, nao apenas KPI pronto.

Como usar:
- Elas rodam direto no `sql_execution` com `{{tenant_id}}` e periodo relativo (`CURRENT_DATE`).
- Use como ponto de partida para responder perguntas de negocio.
- Depois adapte janela de tempo, filtros e `LIMIT`.

### 1) Participacao de GMV por plataforma (90 dias)
Quando usar: para entender dependencia de canal/plataforma.

```sql
WITH base AS (
  SELECT
    COALESCE(p.plataforma, 'Sem plataforma') AS plataforma,
    COALESCE(SUM(p.valor_total), 0)::float AS gmv
  FROM ecommerce.pedidos p
  WHERE p.tenant_id = {{tenant_id}}::int
    AND p.data_pedido::date >= CURRENT_DATE - INTERVAL '90 days'
  GROUP BY 1
)
SELECT
  plataforma AS key,
  plataforma AS label,
  gmv AS value,
  gmv / NULLIF(SUM(gmv) OVER (), 0) AS share_gmv
FROM base
ORDER BY gmv DESC
```

### 2) Top produtos com variacao (30d vs 30d anteriores)
Quando usar: para detectar ganho/perda de tracao no mix de produtos.

```sql
SELECT
  pi.produto_id AS key,
  COALESCE(pr.nome, pi.titulo_item, CONCAT('Produto #', pi.produto_id::text)) AS label,
  COALESCE(SUM(CASE WHEN p.data_pedido::date >= CURRENT_DATE - INTERVAL '30 days' THEN pi.valor_total ELSE 0 END), 0)::float AS receita_30d,
  COALESCE(SUM(CASE WHEN p.data_pedido::date >= CURRENT_DATE - INTERVAL '60 days'
                     AND p.data_pedido::date < CURRENT_DATE - INTERVAL '30 days'
                    THEN pi.valor_total ELSE 0 END), 0)::float AS receita_30d_ant,
  (
    COALESCE(SUM(CASE WHEN p.data_pedido::date >= CURRENT_DATE - INTERVAL '30 days' THEN pi.valor_total ELSE 0 END), 0)
    - COALESCE(SUM(CASE WHEN p.data_pedido::date >= CURRENT_DATE - INTERVAL '60 days'
                         AND p.data_pedido::date < CURRENT_DATE - INTERVAL '30 days'
                        THEN pi.valor_total ELSE 0 END), 0)
  )::float AS delta_abs
FROM ecommerce.pedido_itens pi
LEFT JOIN ecommerce.pedidos p ON p.id = pi.pedido_id
LEFT JOIN ecommerce.produtos pr ON pr.id = pi.produto_id
WHERE pi.tenant_id = {{tenant_id}}::int
  AND p.data_pedido::date >= CURRENT_DATE - INTERVAL '60 days'
GROUP BY 1,2
ORDER BY delta_abs DESC
LIMIT 30
```

### 3) Matriz de status (pagamento x fulfillment)
Quando usar: para descobrir gargalo operacional entre pagamento e entrega.

```sql
SELECT
  COALESCE(p.status_pagamento, 'Sem status_pagamento') || ' | ' || COALESCE(p.status_fulfillment, 'Sem status_fulfillment') AS key,
  COALESCE(p.status_pagamento, 'Sem status_pagamento') || ' | ' || COALESCE(p.status_fulfillment, 'Sem status_fulfillment') AS label,
  COUNT(*)::int AS value
FROM ecommerce.pedidos p
WHERE p.tenant_id = {{tenant_id}}::int
  AND p.data_pedido::date >= CURRENT_DATE - INTERVAL '60 days'
GROUP BY 1,2
ORDER BY value DESC
LIMIT 25
```

### 4) SLA medio de entrega por transportadora (dias)
Quando usar: para medir performance logistica e priorizar transportadoras.

```sql
SELECT
  COALESCE(e.transportadora, 'Sem transportadora') AS key,
  COALESCE(e.transportadora, 'Sem transportadora') AS label,
  COALESCE(AVG(EXTRACT(EPOCH FROM (e.entregue_em - e.despachado_em)) / 86400.0), 0)::float AS value,
  COUNT(*)::int AS entregas
FROM ecommerce.envios e
WHERE e.tenant_id = {{tenant_id}}::int
  AND e.despachado_em IS NOT NULL
  AND e.entregue_em IS NOT NULL
  AND e.despachado_em::date >= CURRENT_DATE - INTERVAL '90 days'
GROUP BY 1,2
ORDER BY value ASC
LIMIT 20
```

### 5) Rentabilidade por conta (GMV, taxa e margem estimada)
Quando usar: para ver qual conta gera mais caixa relativo ao volume.

```sql
SELECT
  p.canal_conta_id AS key,
  COALESCE(cc.nome_conta, CONCAT('Conta #', p.canal_conta_id::text)) AS label,
  COALESCE(SUM(p.valor_total), 0)::float AS gmv,
  COALESCE(SUM(p.taxa_total), 0)::float AS taxa_total,
  COALESCE(SUM(p.valor_liquido_estimado), 0)::float AS value,
  CASE
    WHEN COALESCE(SUM(p.valor_total), 0) = 0 THEN 0
    ELSE COALESCE(SUM(p.valor_liquido_estimado), 0)::float / NULLIF(SUM(p.valor_total), 0)::float
  END AS margem_estimada_pct
FROM ecommerce.pedidos p
LEFT JOIN ecommerce.canais_contas cc ON cc.id = p.canal_conta_id
WHERE p.tenant_id = {{tenant_id}}::int
  AND p.data_pedido::date >= CURRENT_DATE - INTERVAL '90 days'
GROUP BY 1,2
ORDER BY value DESC
LIMIT 20
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
