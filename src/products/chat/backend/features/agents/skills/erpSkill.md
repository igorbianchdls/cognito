# ERP Skill (SQL Query-First)

Objetivo: definir SQL valido para dashboards ERP usando `dataQuery.query`, com base em modelos reais do sistema.

Este skill NAO gera JSONR final.
Para estrutura final de widgets/layout, usar `dashboard_builder`.

## Escopo

Este skill cobre os modulos:
- vendas
- compras
- financeiro
- crm
- estoque

## Fontes de Verdade

Prioridade de referencia:
1. Controllers de query/options do modulo ERP
2. `src/products/bi/shared/queryCatalog.ts`
3. Templates em `src/products/bi/shared/templates/`

Se houver conflito, priorizar controller do modulo.

## Contrato Query-First

Padrao principal para KPI/Chart:

```json
{
  "dataQuery": {
    "query": "SELECT ...",
    "xField": "label",
    "yField": "value",
    "keyField": "key",
    "filters": {}
  }
}
```

Regras:
- KPI: normalmente so `query` (retornando `value`).
- Chart: usar sempre `query`, `xField`, `yField`.
- Evitar formato legado (`model/measure/dimension`) em novos templates.

## Modelos Canonicos (Schema/Tabela/Colunas)

### `vendas.pedidos`
Colunas base (confirmadas):
- `id`, `tenant_id`, `data_pedido`, `status`
- `valor_total`
- `cliente_id`, `vendedor_id`, `canal_venda_id`
- `filial_id`, `unidade_negocio_id`, `territorio_id`, `categoria_receita_id`, `centro_lucro_id`

Joins comuns:
- `vendas.pedidos_itens pi` em `pi.pedido_id = p.id`
- `entidades.clientes c`
- `comercial.vendedores v` + `entidades.funcionarios f`
- `comercial.territorios t`
- `vendas.canais_venda cv`
- `financeiro.categorias_receita cr`
- `empresa.filiais fil`
- `empresa.unidades_negocio un`

### `compras.compras`
Colunas base:
- `id`, `tenant_id`, `data_pedido`, `status`, `valor_total`
- `fornecedor_id`, `centro_custo_id`, `filial_id`, `projeto_id`, `categoria_despesa_id`

Joins comuns:
- `entidades.fornecedores f`
- `empresa.centros_custo cc`
- `empresa.filiais fil`
- `financeiro.projetos pr`
- `financeiro.categorias_despesa cd`

### `compras.recebimentos`
Colunas base:
- `id`, `tenant_id`, `data_recebimento`, `status`

### `financeiro.contas_pagar`
Colunas base:
- `id`, `tenant_id`, `data_vencimento`, `status`
- `valor_liquido`, `numero_documento`
- `fornecedor_id`, `categoria_despesa_id`, `centro_custo_id`, `departamento_id`, `unidade_negocio_id`, `filial_id`, `projeto_id`

### `financeiro.contas_receber`
Colunas base:
- `id`, `tenant_id`, `data_vencimento`, `status`
- `valor_liquido`, `numero_documento`
- `cliente_id`, `categoria_receita_id`, `centro_lucro_id`, `departamento_id`, `unidade_negocio_id`, `filial_id`, `projeto_id`

### `crm.oportunidades`
Colunas base:
- `id`, `tenant_id`, `data_prevista`, `status`
- `valor_estimado`, `probabilidade`
- `vendedor_id`, `fase_pipeline_id`, `conta_id`, `lead_id`

Joins comuns:
- `crm.leads l`, `crm.fases_pipeline fp`, `crm.origens_lead ol`, `crm.contas ct`
- `comercial.vendedores v` + `entidades.funcionarios f`

### `crm.leads`
Colunas base:
- `id`, `tenant_id`, `criado_em`, `status`
- `origem_id`, `responsavel_id`, `empresa`

### `estoque.estoques_atual`
Colunas base:
- `tenant_id`, `atualizado_em`
- `produto_id`, `almoxarifado_id`
- `quantidade`, `custo_medio`

### `estoque.movimentacoes` (alias tecnico: `estoque.movimentacoes_estoque`)
Colunas base:
- `id`, `data_movimento`
- `produto_id`, `almoxarifado_id`
- `tipo_movimento`, `tipo_codigo`, `valor_total`, `quantidade`

## Filtros Canonicos

Mais usados no ERP:
- `{{tenant_id}}`
- `{{de}}`, `{{ate}}`
- IDs de corte do modulo (`cliente_id`, `fornecedor_id`, `filial_id`, etc.)
- `status`

Padrao de data:

```sql
AND ({{de}}::date IS NULL OR src.data_base::date >= {{de}}::date)
AND ({{ate}}::date IS NULL OR src.data_base::date <= {{ate}}::date)
```

Padrao de filtro opcional por id:

```sql
AND ({{cliente_id}}::int IS NULL OR src.cliente_id = {{cliente_id}}::int)
```

## KPIs Canonicos

### Vendas

Faturamento (pedido):
```sql
SELECT COALESCE(SUM(p.valor_total), 0)::float AS value
FROM vendas.pedidos p
WHERE p.tenant_id = {{tenant_id}}::int
  AND ({{de}}::date IS NULL OR p.data_pedido::date >= {{de}}::date)
  AND ({{ate}}::date IS NULL OR p.data_pedido::date <= {{ate}}::date)
```

Pedidos:
```sql
SELECT COUNT(DISTINCT p.id)::int AS value
FROM vendas.pedidos p
WHERE p.tenant_id = {{tenant_id}}::int
  AND ({{de}}::date IS NULL OR p.data_pedido::date >= {{de}}::date)
  AND ({{ate}}::date IS NULL OR p.data_pedido::date <= {{ate}}::date)
```

Ticket medio:
```sql
SELECT COALESCE(AVG(p.valor_total), 0)::float AS value
FROM vendas.pedidos p
WHERE p.tenant_id = {{tenant_id}}::int
  AND ({{de}}::date IS NULL OR p.data_pedido::date >= {{de}}::date)
  AND ({{ate}}::date IS NULL OR p.data_pedido::date <= {{ate}}::date)
```

### Compras

Gasto total:
```sql
SELECT COALESCE(SUM(c.valor_total), 0)::float AS value
FROM compras.compras c
WHERE c.tenant_id = {{tenant_id}}::int
  AND ({{de}}::date IS NULL OR c.data_pedido::date >= {{de}}::date)
  AND ({{ate}}::date IS NULL OR c.data_pedido::date <= {{ate}}::date)
```

### Financeiro

Contas a pagar (valor):
```sql
SELECT COALESCE(SUM(cp.valor_liquido), 0)::float AS value
FROM financeiro.contas_pagar cp
WHERE cp.tenant_id = {{tenant_id}}::int
  AND ({{de}}::date IS NULL OR cp.data_vencimento::date >= {{de}}::date)
  AND ({{ate}}::date IS NULL OR cp.data_vencimento::date <= {{ate}}::date)
```

Contas a receber (valor):
```sql
SELECT COALESCE(SUM(cr.valor_liquido), 0)::float AS value
FROM financeiro.contas_receber cr
WHERE cr.tenant_id = {{tenant_id}}::int
  AND ({{de}}::date IS NULL OR cr.data_vencimento::date >= {{de}}::date)
  AND ({{ate}}::date IS NULL OR cr.data_vencimento::date <= {{ate}}::date)
```

### CRM

Pipeline (valor):
```sql
SELECT COALESCE(SUM(o.valor_estimado), 0)::float AS value
FROM crm.oportunidades o
WHERE o.tenant_id = {{tenant_id}}::int
  AND ({{de}}::date IS NULL OR o.data_prevista::date >= {{de}}::date)
  AND ({{ate}}::date IS NULL OR o.data_prevista::date <= {{ate}}::date)
```

### Estoque

Valor em estoque:
```sql
SELECT COALESCE(SUM(ea.quantidade * ea.custo_medio), 0)::float AS value
FROM estoque.estoques_atual ea
```

## Graficos Canonicos

### Vendas por mes (line)
```sql
SELECT
  TO_CHAR(DATE_TRUNC('month', p.data_pedido), 'YYYY-MM') AS key,
  TO_CHAR(DATE_TRUNC('month', p.data_pedido), 'YYYY-MM') AS label,
  COALESCE(SUM(p.valor_total), 0)::float AS value
FROM vendas.pedidos p
WHERE p.tenant_id = {{tenant_id}}::int
  AND ({{de}}::date IS NULL OR p.data_pedido::date >= {{de}}::date)
  AND ({{ate}}::date IS NULL OR p.data_pedido::date <= {{ate}}::date)
GROUP BY 1,2
ORDER BY 2 ASC
```

### Top clientes (bar)
```sql
SELECT
  c.id AS key,
  COALESCE(c.nome_fantasia, '-') AS label,
  COALESCE(SUM(pi.subtotal), 0)::float AS value
FROM vendas.pedidos p
JOIN vendas.pedidos_itens pi ON pi.pedido_id = p.id
LEFT JOIN entidades.clientes c ON c.id = p.cliente_id
WHERE p.tenant_id = {{tenant_id}}::int
  AND ({{de}}::date IS NULL OR p.data_pedido::date >= {{de}}::date)
  AND ({{ate}}::date IS NULL OR p.data_pedido::date <= {{ate}}::date)
GROUP BY 1,2
ORDER BY 3 DESC
LIMIT 10
```

### Compras por fornecedor (bar)
```sql
SELECT
  f.id AS key,
  COALESCE(f.nome_fantasia, '-') AS label,
  COALESCE(SUM(c.valor_total), 0)::float AS value
FROM compras.compras c
LEFT JOIN entidades.fornecedores f ON f.id = c.fornecedor_id
WHERE c.tenant_id = {{tenant_id}}::int
  AND ({{de}}::date IS NULL OR c.data_pedido::date >= {{de}}::date)
  AND ({{ate}}::date IS NULL OR c.data_pedido::date <= {{ate}}::date)
GROUP BY 1,2
ORDER BY 3 DESC
LIMIT 10
```

### Pipeline por fase (bar)
```sql
SELECT
  fp.id AS key,
  COALESCE(fp.nome, '-') AS label,
  COALESCE(SUM(o.valor_estimado), 0)::float AS value
FROM crm.oportunidades o
LEFT JOIN crm.fases_pipeline fp ON fp.id = o.fase_pipeline_id
WHERE o.tenant_id = {{tenant_id}}::int
  AND ({{de}}::date IS NULL OR o.data_prevista::date >= {{de}}::date)
  AND ({{ate}}::date IS NULL OR o.data_prevista::date <= {{ate}}::date)
GROUP BY 1,2
ORDER BY 3 DESC
```

## Queries de Exploracao (para `sql_execution`)

Estas queries nao sao widgets prontos. Sao consultas investigativas para diagnostico rapido no `sql_execution`.

Como usar:
- Elas foram escritas para rodar direto na tool (`{{tenant_id}}` + periodo relativo com `CURRENT_DATE`).
- Primeiro rode como esta.
- Depois ajuste janela de tempo, filtros e `LIMIT` conforme a pergunta de negocio.

### 1) Concentracao de receita por cliente (Pareto 90 dias)
Quando usar: para saber se a receita esta concentrada em poucos clientes.

```sql
WITH base AS (
  SELECT
    p.cliente_id,
    COALESCE(c.nome_fantasia, CONCAT('Cliente #', p.cliente_id::text)) AS cliente,
    COALESCE(SUM(p.valor_total), 0)::float AS receita
  FROM vendas.pedidos p
  LEFT JOIN entidades.clientes c ON c.id = p.cliente_id
  WHERE p.tenant_id = {{tenant_id}}::int
    AND p.data_pedido::date >= CURRENT_DATE - INTERVAL '90 days'
  GROUP BY 1,2
),
ranked AS (
  SELECT
    *,
    receita / NULLIF(SUM(receita) OVER (), 0) AS share_receita,
    SUM(receita) OVER (ORDER BY receita DESC ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW)
      / NULLIF(SUM(receita) OVER (), 0) AS share_acumulada
  FROM base
)
SELECT
  cliente_id AS key,
  cliente AS label,
  receita AS value,
  share_receita,
  share_acumulada
FROM ranked
ORDER BY receita DESC
LIMIT 30
```

### 2) Vendas semanais por canal com variacao vs semana anterior
Quando usar: para detectar queda/aceleracao de canal sem esperar fechamento mensal.

```sql
WITH semanal AS (
  SELECT
    DATE_TRUNC('week', p.data_pedido)::date AS semana,
    COALESCE(cv.nome, 'Sem canal') AS canal,
    COALESCE(SUM(p.valor_total), 0)::float AS receita
  FROM vendas.pedidos p
  LEFT JOIN vendas.canais_venda cv ON cv.id = p.canal_venda_id
  WHERE p.tenant_id = {{tenant_id}}::int
    AND p.data_pedido::date >= CURRENT_DATE - INTERVAL '16 weeks'
  GROUP BY 1,2
),
serie AS (
  SELECT
    *,
    LAG(receita) OVER (PARTITION BY canal ORDER BY semana) AS receita_semana_anterior
  FROM semanal
)
SELECT
  TO_CHAR(semana, 'YYYY-MM-DD') AS key,
  canal || ' | ' || TO_CHAR(semana, 'YYYY-MM-DD') AS label,
  receita AS value,
  receita_semana_anterior,
  CASE
    WHEN COALESCE(receita_semana_anterior, 0) = 0 THEN NULL
    ELSE (receita - receita_semana_anterior) / NULLIF(receita_semana_anterior, 0)
  END AS variacao_pct
FROM serie
ORDER BY semana DESC, receita DESC
LIMIT 200
```

### 3) Fornecedores com maior crescimento de compras (30d vs 30d anteriores)
Quando usar: para identificar aumento de dependencia ou mudanca de mix de compras.

```sql
WITH atual AS (
  SELECT
    c.fornecedor_id,
    COALESCE(SUM(c.valor_total), 0)::float AS gasto_atual
  FROM compras.compras c
  WHERE c.tenant_id = {{tenant_id}}::int
    AND c.data_pedido::date >= CURRENT_DATE - INTERVAL '30 days'
  GROUP BY 1
),
anterior AS (
  SELECT
    c.fornecedor_id,
    COALESCE(SUM(c.valor_total), 0)::float AS gasto_anterior
  FROM compras.compras c
  WHERE c.tenant_id = {{tenant_id}}::int
    AND c.data_pedido::date >= CURRENT_DATE - INTERVAL '60 days'
    AND c.data_pedido::date < CURRENT_DATE - INTERVAL '30 days'
  GROUP BY 1
)
SELECT
  COALESCE(a.fornecedor_id, p.fornecedor_id) AS key,
  COALESCE(f.nome_fantasia, CONCAT('Fornecedor #', COALESCE(a.fornecedor_id, p.fornecedor_id)::text)) AS label,
  COALESCE(a.gasto_atual, 0) AS gasto_atual,
  COALESCE(p.gasto_anterior, 0) AS gasto_anterior,
  (COALESCE(a.gasto_atual, 0) - COALESCE(p.gasto_anterior, 0))::float AS delta_abs,
  CASE
    WHEN COALESCE(p.gasto_anterior, 0) = 0 THEN NULL
    ELSE (COALESCE(a.gasto_atual, 0) - COALESCE(p.gasto_anterior, 0)) / NULLIF(p.gasto_anterior, 0)
  END AS delta_pct
FROM atual a
FULL OUTER JOIN anterior p ON p.fornecedor_id = a.fornecedor_id
LEFT JOIN entidades.fornecedores f ON f.id = COALESCE(a.fornecedor_id, p.fornecedor_id)
ORDER BY delta_abs DESC
LIMIT 25
```

### 4) Aging de contas a receber vencidas
Quando usar: para diagnosticar risco de caixa e priorizar cobranca.

```sql
SELECT
  CASE
    WHEN CURRENT_DATE - cr.data_vencimento::date BETWEEN 1 AND 7 THEN '01-07 dias'
    WHEN CURRENT_DATE - cr.data_vencimento::date BETWEEN 8 AND 30 THEN '08-30 dias'
    WHEN CURRENT_DATE - cr.data_vencimento::date BETWEEN 31 AND 60 THEN '31-60 dias'
    ELSE '61+ dias'
  END AS key,
  CASE
    WHEN CURRENT_DATE - cr.data_vencimento::date BETWEEN 1 AND 7 THEN '01-07 dias'
    WHEN CURRENT_DATE - cr.data_vencimento::date BETWEEN 8 AND 30 THEN '08-30 dias'
    WHEN CURRENT_DATE - cr.data_vencimento::date BETWEEN 31 AND 60 THEN '31-60 dias'
    ELSE '61+ dias'
  END AS label,
  COALESCE(SUM(cr.valor_liquido), 0)::float AS value,
  COUNT(*)::int AS titulos
FROM financeiro.contas_receber cr
WHERE cr.tenant_id = {{tenant_id}}::int
  AND cr.data_vencimento::date < CURRENT_DATE
  AND LOWER(COALESCE(cr.status, '')) NOT IN ('pago', 'baixado', 'cancelado')
GROUP BY 1,2
ORDER BY value DESC
```

### 5) Pipeline ponderado por fase
Quando usar: para priorizar fase com maior impacto esperado (nao apenas volume bruto).

```sql
SELECT
  fp.id AS key,
  COALESCE(fp.nome, 'Sem fase') AS label,
  COALESCE(SUM(o.valor_estimado), 0)::float AS pipeline_bruto,
  COALESCE(SUM(o.valor_estimado * COALESCE(o.probabilidade, 0) / 100.0), 0)::float AS value,
  COUNT(*)::int AS oportunidades
FROM crm.oportunidades o
LEFT JOIN crm.fases_pipeline fp ON fp.id = o.fase_pipeline_id
WHERE o.tenant_id = {{tenant_id}}::int
  AND o.data_prevista::date >= CURRENT_DATE - INTERVAL '180 days'
GROUP BY 1,2
ORDER BY value DESC
LIMIT 20
```

## Regras Anti-Erro

- Nao usar `to_jsonb(src)->>'campo'` quando coluna fisica existe.
- Nao usar barra `/` dentro do SQL bruto.
- Nao inventar colunas que nao estao no controller/catalog.
- So adicionar join quando a coluna for usada em `SELECT/WHERE/GROUP BY`.
- Para percentuais, sempre proteger divisor com `NULLIF` ou `CASE`.
- Para KPI de pedidos, preferir `COUNT(DISTINCT id)` quando existir join com itens.

## Handoff para `dashboard_builder`

Exemplo de payload:

```json
{
  "widget_type": "chart",
  "payload": {
    "title": "Vendas por Mes",
    "chart_type": "line",
    "query": "SELECT ...",
    "xField": "label",
    "yField": "value",
    "keyField": "key",
    "formato": "currency"
  }
}
```
