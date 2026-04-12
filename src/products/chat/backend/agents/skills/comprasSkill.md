# Compras Skill (SQL Query-First para /apps/compras)

Objetivo: definir SQL valido para KPIs e graficos de compras no padrao do template `src/products/bi/shared/templates/appsComprasTemplate.ts`.

Este skill NAO monta DSL completo.
Para estrutura/layout e persistencia final de dashboard, usar `artifact_write` e `artifact_patch` (com `artifact_read` para inspecao do estado atual).

## Escopo Estrito

Este skill cobre somente tabelas e joins usados no template atual de Compras.
Nao expandir para tabelas fora do template.

## Fonte de Verdade

Prioridade de referencia:
1. `src/products/bi/shared/templates/appsComprasTemplate.ts`
2. `src/products/bi/shared/queryCatalog.ts` (entrada `compras.compras`)

Se houver conflito, priorizar template.

## Sugestao de Dashboard (Canonico)

Fonte canonica: `src/products/bi/shared/templates/appsComprasTemplate.ts`.

### KPI / Chart (descricao semantica + query literal)

- KPI de Gasto.

```sql
SELECT
  COALESCE(SUM(src.valor_total), 0)::float AS value
FROM compras.compras src
WHERE src.tenant_id = {{tenant_id}}
  AND ({{de}}::date IS NULL OR src.data_pedido::date >= {{de}}::date)
  AND ({{ate}}::date IS NULL OR src.data_pedido::date <= {{ate}}::date)
  AND (
    NULLIF(regexp_replace({{fornecedor_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
    OR COALESCE(src.fornecedor_id::text, '') = ANY(
      string_to_array(regexp_replace({{fornecedor_id}}::text, '[{}[:space:]]', '', 'g'), ',')
    )
  )
  AND (
    NULLIF(regexp_replace({{centro_custo_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
    OR COALESCE(src.centro_custo_id::text, '') = ANY(
      string_to_array(regexp_replace({{centro_custo_id}}::text, '[{}[:space:]]', '', 'g'), ',')
    )
  )
  AND (
    NULLIF(regexp_replace({{filial_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
    OR COALESCE(src.filial_id::text, '') = ANY(
      string_to_array(regexp_replace({{filial_id}}::text, '[{}[:space:]]', '', 'g'), ',')
    )
  )
  AND (
    NULLIF(regexp_replace({{categoria_despesa_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
    OR COALESCE(src.categoria_despesa_id::text, '') = ANY(
      string_to_array(regexp_replace({{categoria_despesa_id}}::text, '[{}[:space:]]', '', 'g'), ',')
    )
  )
  AND (
    NULLIF(regexp_replace({{projeto_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
    OR COALESCE(src.projeto_id::text, '') = ANY(
      string_to_array(regexp_replace({{projeto_id}}::text, '[{}[:space:]]', '', 'g'), ',')
    )
  )
```

- KPI de Fornecedores.

```sql
SELECT
  COUNT(DISTINCT src.fornecedor_id)::int AS value
FROM compras.compras src
WHERE src.tenant_id = {{tenant_id}}
  AND ({{de}}::date IS NULL OR src.data_pedido::date >= {{de}}::date)
  AND ({{ate}}::date IS NULL OR src.data_pedido::date <= {{ate}}::date)
  AND (
    NULLIF(regexp_replace({{fornecedor_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
    OR COALESCE(src.fornecedor_id::text, '') = ANY(
      string_to_array(regexp_replace({{fornecedor_id}}::text, '[{}[:space:]]', '', 'g'), ',')
    )
  )
  AND (
    NULLIF(regexp_replace({{centro_custo_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
    OR COALESCE(src.centro_custo_id::text, '') = ANY(
      string_to_array(regexp_replace({{centro_custo_id}}::text, '[{}[:space:]]', '', 'g'), ',')
    )
  )
  AND (
    NULLIF(regexp_replace({{filial_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
    OR COALESCE(src.filial_id::text, '') = ANY(
      string_to_array(regexp_replace({{filial_id}}::text, '[{}[:space:]]', '', 'g'), ',')
    )
  )
  AND (
    NULLIF(regexp_replace({{categoria_despesa_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
    OR COALESCE(src.categoria_despesa_id::text, '') = ANY(
      string_to_array(regexp_replace({{categoria_despesa_id}}::text, '[{}[:space:]]', '', 'g'), ',')
    )
  )
  AND (
    NULLIF(regexp_replace({{projeto_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
    OR COALESCE(src.projeto_id::text, '') = ANY(
      string_to_array(regexp_replace({{projeto_id}}::text, '[{}[:space:]]', '', 'g'), ',')
    )
  )
```

- KPI de Pedidos.

```sql
SELECT
  COUNT(DISTINCT src.id)::int AS value
FROM compras.compras src
WHERE src.tenant_id = {{tenant_id}}
  AND ({{de}}::date IS NULL OR src.data_pedido::date >= {{de}}::date)
  AND ({{ate}}::date IS NULL OR src.data_pedido::date <= {{ate}}::date)
  AND (
    NULLIF(regexp_replace({{fornecedor_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
    OR COALESCE(src.fornecedor_id::text, '') = ANY(
      string_to_array(regexp_replace({{fornecedor_id}}::text, '[{}[:space:]]', '', 'g'), ',')
    )
  )
  AND (
    NULLIF(regexp_replace({{centro_custo_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
    OR COALESCE(src.centro_custo_id::text, '') = ANY(
      string_to_array(regexp_replace({{centro_custo_id}}::text, '[{}[:space:]]', '', 'g'), ',')
    )
  )
  AND (
    NULLIF(regexp_replace({{filial_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
    OR COALESCE(src.filial_id::text, '') = ANY(
      string_to_array(regexp_replace({{filial_id}}::text, '[{}[:space:]]', '', 'g'), ',')
    )
  )
  AND (
    NULLIF(regexp_replace({{categoria_despesa_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
    OR COALESCE(src.categoria_despesa_id::text, '') = ANY(
      string_to_array(regexp_replace({{categoria_despesa_id}}::text, '[{}[:space:]]', '', 'g'), ',')
    )
  )
  AND (
    NULLIF(regexp_replace({{projeto_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
    OR COALESCE(src.projeto_id::text, '') = ANY(
      string_to_array(regexp_replace({{projeto_id}}::text, '[{}[:space:]]', '', 'g'), ',')
    )
  )
```

- KPI de Transacoes.

```sql
SELECT
  COUNT(DISTINCT r.id)::int AS value
FROM compras.recebimentos r
JOIN compras.compras src ON src.id = r.compra_id
WHERE src.tenant_id = {{tenant_id}}
  AND ({{de}}::date IS NULL OR src.data_pedido::date >= {{de}}::date)
  AND ({{ate}}::date IS NULL OR src.data_pedido::date <= {{ate}}::date)
  AND (
    NULLIF(regexp_replace({{fornecedor_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
    OR COALESCE(src.fornecedor_id::text, '') = ANY(
      string_to_array(regexp_replace({{fornecedor_id}}::text, '[{}[:space:]]', '', 'g'), ',')
    )
  )
  AND (
    NULLIF(regexp_replace({{centro_custo_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
    OR COALESCE(src.centro_custo_id::text, '') = ANY(
      string_to_array(regexp_replace({{centro_custo_id}}::text, '[{}[:space:]]', '', 'g'), ',')
    )
  )
  AND (
    NULLIF(regexp_replace({{filial_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
    OR COALESCE(src.filial_id::text, '') = ANY(
      string_to_array(regexp_replace({{filial_id}}::text, '[{}[:space:]]', '', 'g'), ',')
    )
  )
  AND (
    NULLIF(regexp_replace({{categoria_despesa_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
    OR COALESCE(src.categoria_despesa_id::text, '') = ANY(
      string_to_array(regexp_replace({{categoria_despesa_id}}::text, '[{}[:space:]]', '', 'g'), ',')
    )
  )
  AND (
    NULLIF(regexp_replace({{projeto_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
    OR COALESCE(src.projeto_id::text, '') = ANY(
      string_to_array(regexp_replace({{projeto_id}}::text, '[{}[:space:]]', '', 'g'), ',')
    )
  )
```

- Grafico de Fornecedores.

```sql
SELECT
  COALESCE(src.fornecedor_id, 0)::text AS key,
  COALESCE(f.nome_fantasia, '-') AS label,
  COALESCE(SUM(src.valor_total), 0)::float AS value
FROM compras.compras src
LEFT JOIN entidades.fornecedores f ON f.id = src.fornecedor_id
WHERE src.tenant_id = {{tenant_id}}
  AND ({{de}}::date IS NULL OR src.data_pedido::date >= {{de}}::date)
  AND ({{ate}}::date IS NULL OR src.data_pedido::date <= {{ate}}::date)
  AND (
    NULLIF(regexp_replace({{fornecedor_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
    OR COALESCE(src.fornecedor_id::text, '') = ANY(
      string_to_array(regexp_replace({{fornecedor_id}}::text, '[{}[:space:]]', '', 'g'), ',')
    )
  )
  AND (
    NULLIF(regexp_replace({{centro_custo_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
    OR COALESCE(src.centro_custo_id::text, '') = ANY(
      string_to_array(regexp_replace({{centro_custo_id}}::text, '[{}[:space:]]', '', 'g'), ',')
    )
  )
  AND (
    NULLIF(regexp_replace({{filial_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
    OR COALESCE(src.filial_id::text, '') = ANY(
      string_to_array(regexp_replace({{filial_id}}::text, '[{}[:space:]]', '', 'g'), ',')
    )
  )
  AND (
    NULLIF(regexp_replace({{categoria_despesa_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
    OR COALESCE(src.categoria_despesa_id::text, '') = ANY(
      string_to_array(regexp_replace({{categoria_despesa_id}}::text, '[{}[:space:]]', '', 'g'), ',')
    )
  )
  AND (
    NULLIF(regexp_replace({{projeto_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
    OR COALESCE(src.projeto_id::text, '') = ANY(
      string_to_array(regexp_replace({{projeto_id}}::text, '[{}[:space:]]', '', 'g'), ',')
    )
  )
GROUP BY 1, 2
ORDER BY 3 DESC
```

- Grafico de Centros de Custo.

```sql
SELECT
  COALESCE(src.centro_custo_id, 0)::text AS key,
  COALESCE(cc.nome, '-') AS label,
  COALESCE(SUM(src.valor_total), 0)::float AS value
FROM compras.compras src
LEFT JOIN empresa.centros_custo cc ON cc.id = src.centro_custo_id
WHERE src.tenant_id = {{tenant_id}}
  AND ({{de}}::date IS NULL OR src.data_pedido::date >= {{de}}::date)
  AND ({{ate}}::date IS NULL OR src.data_pedido::date <= {{ate}}::date)
  AND (
    NULLIF(regexp_replace({{fornecedor_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
    OR COALESCE(src.fornecedor_id::text, '') = ANY(
      string_to_array(regexp_replace({{fornecedor_id}}::text, '[{}[:space:]]', '', 'g'), ',')
    )
  )
  AND (
    NULLIF(regexp_replace({{centro_custo_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
    OR COALESCE(src.centro_custo_id::text, '') = ANY(
      string_to_array(regexp_replace({{centro_custo_id}}::text, '[{}[:space:]]', '', 'g'), ',')
    )
  )
  AND (
    NULLIF(regexp_replace({{filial_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
    OR COALESCE(src.filial_id::text, '') = ANY(
      string_to_array(regexp_replace({{filial_id}}::text, '[{}[:space:]]', '', 'g'), ',')
    )
  )
  AND (
    NULLIF(regexp_replace({{categoria_despesa_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
    OR COALESCE(src.categoria_despesa_id::text, '') = ANY(
      string_to_array(regexp_replace({{categoria_despesa_id}}::text, '[{}[:space:]]', '', 'g'), ',')
    )
  )
  AND (
    NULLIF(regexp_replace({{projeto_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
    OR COALESCE(src.projeto_id::text, '') = ANY(
      string_to_array(regexp_replace({{projeto_id}}::text, '[{}[:space:]]', '', 'g'), ',')
    )
  )
GROUP BY 1, 2
ORDER BY 3 DESC
```

- Grafico de Filiais.

```sql
SELECT
  COALESCE(src.filial_id, 0)::text AS key,
  COALESCE(fil.nome, '-') AS label,
  COALESCE(SUM(src.valor_total), 0)::float AS value
FROM compras.compras src
LEFT JOIN empresa.filiais fil ON fil.id = src.filial_id
WHERE src.tenant_id = {{tenant_id}}
  AND ({{de}}::date IS NULL OR src.data_pedido::date >= {{de}}::date)
  AND ({{ate}}::date IS NULL OR src.data_pedido::date <= {{ate}}::date)
  AND (
    NULLIF(regexp_replace({{fornecedor_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
    OR COALESCE(src.fornecedor_id::text, '') = ANY(
      string_to_array(regexp_replace({{fornecedor_id}}::text, '[{}[:space:]]', '', 'g'), ',')
    )
  )
  AND (
    NULLIF(regexp_replace({{centro_custo_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
    OR COALESCE(src.centro_custo_id::text, '') = ANY(
      string_to_array(regexp_replace({{centro_custo_id}}::text, '[{}[:space:]]', '', 'g'), ',')
    )
  )
  AND (
    NULLIF(regexp_replace({{filial_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
    OR COALESCE(src.filial_id::text, '') = ANY(
      string_to_array(regexp_replace({{filial_id}}::text, '[{}[:space:]]', '', 'g'), ',')
    )
  )
  AND (
    NULLIF(regexp_replace({{categoria_despesa_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
    OR COALESCE(src.categoria_despesa_id::text, '') = ANY(
      string_to_array(regexp_replace({{categoria_despesa_id}}::text, '[{}[:space:]]', '', 'g'), ',')
    )
  )
  AND (
    NULLIF(regexp_replace({{projeto_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
    OR COALESCE(src.projeto_id::text, '') = ANY(
      string_to_array(regexp_replace({{projeto_id}}::text, '[{}[:space:]]', '', 'g'), ',')
    )
  )
GROUP BY 1, 2
ORDER BY 3 DESC
```

- Grafico de Categorias.

```sql
SELECT
  COALESCE(src.categoria_despesa_id, 0)::text AS key,
  COALESCE(cd.nome, '-') AS label,
  COALESCE(SUM(src.valor_total), 0)::float AS value
FROM compras.compras src
LEFT JOIN financeiro.categorias_despesa cd ON cd.id = src.categoria_despesa_id
WHERE src.tenant_id = {{tenant_id}}
  AND ({{de}}::date IS NULL OR src.data_pedido::date >= {{de}}::date)
  AND ({{ate}}::date IS NULL OR src.data_pedido::date <= {{ate}}::date)
  AND (
    NULLIF(regexp_replace({{fornecedor_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
    OR COALESCE(src.fornecedor_id::text, '') = ANY(
      string_to_array(regexp_replace({{fornecedor_id}}::text, '[{}[:space:]]', '', 'g'), ',')
    )
  )
  AND (
    NULLIF(regexp_replace({{centro_custo_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
    OR COALESCE(src.centro_custo_id::text, '') = ANY(
      string_to_array(regexp_replace({{centro_custo_id}}::text, '[{}[:space:]]', '', 'g'), ',')
    )
  )
  AND (
    NULLIF(regexp_replace({{filial_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
    OR COALESCE(src.filial_id::text, '') = ANY(
      string_to_array(regexp_replace({{filial_id}}::text, '[{}[:space:]]', '', 'g'), ',')
    )
  )
  AND (
    NULLIF(regexp_replace({{categoria_despesa_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
    OR COALESCE(src.categoria_despesa_id::text, '') = ANY(
      string_to_array(regexp_replace({{categoria_despesa_id}}::text, '[{}[:space:]]', '', 'g'), ',')
    )
  )
  AND (
    NULLIF(regexp_replace({{projeto_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
    OR COALESCE(src.projeto_id::text, '') = ANY(
      string_to_array(regexp_replace({{projeto_id}}::text, '[{}[:space:]]', '', 'g'), ',')
    )
  )
GROUP BY 1, 2
ORDER BY 3 DESC
```

- Grafico de Projetos.

```sql
SELECT
  COALESCE(src.projeto_id, 0)::text AS key,
  COALESCE(pr.nome, '-') AS label,
  COALESCE(SUM(src.valor_total), 0)::float AS value
FROM compras.compras src
LEFT JOIN financeiro.projetos pr ON pr.id = src.projeto_id
WHERE src.tenant_id = {{tenant_id}}
  AND ({{de}}::date IS NULL OR src.data_pedido::date >= {{de}}::date)
  AND ({{ate}}::date IS NULL OR src.data_pedido::date <= {{ate}}::date)
  AND (
    NULLIF(regexp_replace({{fornecedor_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
    OR COALESCE(src.fornecedor_id::text, '') = ANY(
      string_to_array(regexp_replace({{fornecedor_id}}::text, '[{}[:space:]]', '', 'g'), ',')
    )
  )
  AND (
    NULLIF(regexp_replace({{centro_custo_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
    OR COALESCE(src.centro_custo_id::text, '') = ANY(
      string_to_array(regexp_replace({{centro_custo_id}}::text, '[{}[:space:]]', '', 'g'), ',')
    )
  )
  AND (
    NULLIF(regexp_replace({{filial_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
    OR COALESCE(src.filial_id::text, '') = ANY(
      string_to_array(regexp_replace({{filial_id}}::text, '[{}[:space:]]', '', 'g'), ',')
    )
  )
  AND (
    NULLIF(regexp_replace({{categoria_despesa_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
    OR COALESCE(src.categoria_despesa_id::text, '') = ANY(
      string_to_array(regexp_replace({{categoria_despesa_id}}::text, '[{}[:space:]]', '', 'g'), ',')
    )
  )
  AND (
    NULLIF(regexp_replace({{projeto_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
    OR COALESCE(src.projeto_id::text, '') = ANY(
      string_to_array(regexp_replace({{projeto_id}}::text, '[{}[:space:]]', '', 'g'), ',')
    )
  )
GROUP BY 1, 2
ORDER BY 3 DESC
```

- Grafico de Status (Qtd).

```sql
SELECT
  COALESCE(src.status, '-') AS key,
  COALESCE(src.status, '-') AS label,
  COUNT(*)::int AS value
FROM compras.compras src
WHERE src.tenant_id = {{tenant_id}}
  AND ({{de}}::date IS NULL OR src.data_pedido::date >= {{de}}::date)
  AND ({{ate}}::date IS NULL OR src.data_pedido::date <= {{ate}}::date)
  AND (
    NULLIF(regexp_replace({{fornecedor_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
    OR COALESCE(src.fornecedor_id::text, '') = ANY(
      string_to_array(regexp_replace({{fornecedor_id}}::text, '[{}[:space:]]', '', 'g'), ',')
    )
  )
  AND (
    NULLIF(regexp_replace({{centro_custo_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
    OR COALESCE(src.centro_custo_id::text, '') = ANY(
      string_to_array(regexp_replace({{centro_custo_id}}::text, '[{}[:space:]]', '', 'g'), ',')
    )
  )
  AND (
    NULLIF(regexp_replace({{filial_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
    OR COALESCE(src.filial_id::text, '') = ANY(
      string_to_array(regexp_replace({{filial_id}}::text, '[{}[:space:]]', '', 'g'), ',')
    )
  )
  AND (
    NULLIF(regexp_replace({{categoria_despesa_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
    OR COALESCE(src.categoria_despesa_id::text, '') = ANY(
      string_to_array(regexp_replace({{categoria_despesa_id}}::text, '[{}[:space:]]', '', 'g'), ',')
    )
  )
  AND (
    NULLIF(regexp_replace({{projeto_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
    OR COALESCE(src.projeto_id::text, '') = ANY(
      string_to_array(regexp_replace({{projeto_id}}::text, '[{}[:space:]]', '', 'g'), ',')
    )
  )
GROUP BY 1, 2
ORDER BY 3 DESC
```

- Grafico de Status (Pizza).

```sql
SELECT
  COALESCE(src.status, '-') AS key,
  COALESCE(src.status, '-') AS label,
  COUNT(*)::int AS value
FROM compras.compras src
WHERE src.tenant_id = {{tenant_id}}
  AND ({{de}}::date IS NULL OR src.data_pedido::date >= {{de}}::date)
  AND ({{ate}}::date IS NULL OR src.data_pedido::date <= {{ate}}::date)
  AND (
    NULLIF(regexp_replace({{fornecedor_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
    OR COALESCE(src.fornecedor_id::text, '') = ANY(
      string_to_array(regexp_replace({{fornecedor_id}}::text, '[{}[:space:]]', '', 'g'), ',')
    )
  )
  AND (
    NULLIF(regexp_replace({{centro_custo_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
    OR COALESCE(src.centro_custo_id::text, '') = ANY(
      string_to_array(regexp_replace({{centro_custo_id}}::text, '[{}[:space:]]', '', 'g'), ',')
    )
  )
  AND (
    NULLIF(regexp_replace({{filial_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
    OR COALESCE(src.filial_id::text, '') = ANY(
      string_to_array(regexp_replace({{filial_id}}::text, '[{}[:space:]]', '', 'g'), ',')
    )
  )
  AND (
    NULLIF(regexp_replace({{categoria_despesa_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
    OR COALESCE(src.categoria_despesa_id::text, '') = ANY(
      string_to_array(regexp_replace({{categoria_despesa_id}}::text, '[{}[:space:]]', '', 'g'), ',')
    )
  )
  AND (
    NULLIF(regexp_replace({{projeto_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
    OR COALESCE(src.projeto_id::text, '') = ANY(
      string_to_array(regexp_replace({{projeto_id}}::text, '[{}[:space:]]', '', 'g'), ',')
    )
  )
GROUP BY 1, 2
ORDER BY 3 DESC
```

- Grafico de Gasto por Mes.

```sql
SELECT
  TO_CHAR(DATE_TRUNC('month', src.data_pedido), 'YYYY-MM') AS key,
  TO_CHAR(DATE_TRUNC('month', src.data_pedido), 'YYYY-MM') AS label,
  COALESCE(SUM(src.valor_total), 0)::float AS value
FROM compras.compras src
WHERE src.tenant_id = {{tenant_id}}
  AND ({{de}}::date IS NULL OR src.data_pedido::date >= {{de}}::date)
  AND ({{ate}}::date IS NULL OR src.data_pedido::date <= {{ate}}::date)
  AND (
    NULLIF(regexp_replace({{fornecedor_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
    OR COALESCE(src.fornecedor_id::text, '') = ANY(
      string_to_array(regexp_replace({{fornecedor_id}}::text, '[{}[:space:]]', '', 'g'), ',')
    )
  )
  AND (
    NULLIF(regexp_replace({{centro_custo_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
    OR COALESCE(src.centro_custo_id::text, '') = ANY(
      string_to_array(regexp_replace({{centro_custo_id}}::text, '[{}[:space:]]', '', 'g'), ',')
    )
  )
  AND (
    NULLIF(regexp_replace({{filial_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
    OR COALESCE(src.filial_id::text, '') = ANY(
      string_to_array(regexp_replace({{filial_id}}::text, '[{}[:space:]]', '', 'g'), ',')
    )
  )
  AND (
    NULLIF(regexp_replace({{categoria_despesa_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
    OR COALESCE(src.categoria_despesa_id::text, '') = ANY(
      string_to_array(regexp_replace({{categoria_despesa_id}}::text, '[{}[:space:]]', '', 'g'), ',')
    )
  )
  AND (
    NULLIF(regexp_replace({{projeto_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
    OR COALESCE(src.projeto_id::text, '') = ANY(
      string_to_array(regexp_replace({{projeto_id}}::text, '[{}[:space:]]', '', 'g'), ',')
    )
  )
GROUP BY 1, 2
ORDER BY 2 ASC
```

- Grafico de Pedidos por Mes.

```sql
SELECT
  TO_CHAR(DATE_TRUNC('month', src.data_pedido), 'YYYY-MM') AS key,
  TO_CHAR(DATE_TRUNC('month', src.data_pedido), 'YYYY-MM') AS label,
  COUNT(DISTINCT src.id)::int AS value
FROM compras.compras src
WHERE src.tenant_id = {{tenant_id}}
  AND ({{de}}::date IS NULL OR src.data_pedido::date >= {{de}}::date)
  AND ({{ate}}::date IS NULL OR src.data_pedido::date <= {{ate}}::date)
  AND (
    NULLIF(regexp_replace({{fornecedor_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
    OR COALESCE(src.fornecedor_id::text, '') = ANY(
      string_to_array(regexp_replace({{fornecedor_id}}::text, '[{}[:space:]]', '', 'g'), ',')
    )
  )
  AND (
    NULLIF(regexp_replace({{centro_custo_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
    OR COALESCE(src.centro_custo_id::text, '') = ANY(
      string_to_array(regexp_replace({{centro_custo_id}}::text, '[{}[:space:]]', '', 'g'), ',')
    )
  )
  AND (
    NULLIF(regexp_replace({{filial_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
    OR COALESCE(src.filial_id::text, '') = ANY(
      string_to_array(regexp_replace({{filial_id}}::text, '[{}[:space:]]', '', 'g'), ',')
    )
  )
  AND (
    NULLIF(regexp_replace({{categoria_despesa_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
    OR COALESCE(src.categoria_despesa_id::text, '') = ANY(
      string_to_array(regexp_replace({{categoria_despesa_id}}::text, '[{}[:space:]]', '', 'g'), ',')
    )
  )
  AND (
    NULLIF(regexp_replace({{projeto_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
    OR COALESCE(src.projeto_id::text, '') = ANY(
      string_to_array(regexp_replace({{projeto_id}}::text, '[{}[:space:]]', '', 'g'), ',')
    )
  )
GROUP BY 1, 2
ORDER BY 2 ASC
```

- Grafico de Ticket Medio por Mes.

```sql
SELECT
  TO_CHAR(DATE_TRUNC('month', src.data_pedido), 'YYYY-MM') AS key,
  TO_CHAR(DATE_TRUNC('month', src.data_pedido), 'YYYY-MM') AS label,
  COALESCE(AVG(src.valor_total), 0)::float AS value
FROM compras.compras src
WHERE src.tenant_id = {{tenant_id}}
  AND ({{de}}::date IS NULL OR src.data_pedido::date >= {{de}}::date)
  AND ({{ate}}::date IS NULL OR src.data_pedido::date <= {{ate}}::date)
  AND (
    NULLIF(regexp_replace({{fornecedor_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
    OR COALESCE(src.fornecedor_id::text, '') = ANY(
      string_to_array(regexp_replace({{fornecedor_id}}::text, '[{}[:space:]]', '', 'g'), ',')
    )
  )
  AND (
    NULLIF(regexp_replace({{centro_custo_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
    OR COALESCE(src.centro_custo_id::text, '') = ANY(
      string_to_array(regexp_replace({{centro_custo_id}}::text, '[{}[:space:]]', '', 'g'), ',')
    )
  )
  AND (
    NULLIF(regexp_replace({{filial_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
    OR COALESCE(src.filial_id::text, '') = ANY(
      string_to_array(regexp_replace({{filial_id}}::text, '[{}[:space:]]', '', 'g'), ',')
    )
  )
  AND (
    NULLIF(regexp_replace({{categoria_despesa_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
    OR COALESCE(src.categoria_despesa_id::text, '') = ANY(
      string_to_array(regexp_replace({{categoria_despesa_id}}::text, '[{}[:space:]]', '', 'g'), ',')
    )
  )
  AND (
    NULLIF(regexp_replace({{projeto_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
    OR COALESCE(src.projeto_id::text, '') = ANY(
      string_to_array(regexp_replace({{projeto_id}}::text, '[{}[:space:]]', '', 'g'), ',')
    )
  )
GROUP BY 1, 2
ORDER BY 2 ASC
```

### Slicer (descricao semantica + query literal)

- Slicer de Centro de Custo.

```sql
SELECT
  DISTINCT COALESCE(src.centro_custo_id, 0)::text AS value,
  COALESCE(cc.nome, '-') AS label
FROM compras.compras src
LEFT JOIN empresa.centros_custo cc ON cc.id = src.centro_custo_id
WHERE src.tenant_id = {{tenant_id}}
ORDER BY 2 ASC
```
## Tabela Base e Lookups do Template

### `compras.compras src`
Colunas usadas no template:
- `id`, `tenant_id`, `data_pedido`, `status`
- `valor_total`
- `fornecedor_id`, `centro_custo_id`, `filial_id`, `categoria_despesa_id`, `projeto_id`

### Lookups usados no template
- `entidades.fornecedores f` (`id`, `nome_fantasia`)
- `empresa.centros_custo cc` (`id`, `nome`)
- `empresa.filiais fil` (`id`, `nome`)
- `financeiro.categorias_despesa cd` (`id`, `nome`)
- `financeiro.projetos pr` (`id`, `nome`)

## Filtro Canonico de Compras

```sql
WHERE src.tenant_id = {{tenant_id}}
  AND ({{de}}::date IS NULL OR src.data_pedido::date >= {{de}}::date)
  AND ({{ate}}::date IS NULL OR src.data_pedido::date <= {{ate}}::date)
  AND (
    NULLIF(regexp_replace({{fornecedor_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
    OR COALESCE(src.fornecedor_id::text, '') = ANY(
      string_to_array(regexp_replace({{fornecedor_id}}::text, '[{}[:space:]]', '', 'g'), ',')
    )
  )
  AND (
    NULLIF(regexp_replace({{centro_custo_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
    OR COALESCE(src.centro_custo_id::text, '') = ANY(
      string_to_array(regexp_replace({{centro_custo_id}}::text, '[{}[:space:]]', '', 'g'), ',')
    )
  )
  AND (
    NULLIF(regexp_replace({{filial_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
    OR COALESCE(src.filial_id::text, '') = ANY(
      string_to_array(regexp_replace({{filial_id}}::text, '[{}[:space:]]', '', 'g'), ',')
    )
  )
  AND (
    NULLIF(regexp_replace({{categoria_despesa_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
    OR COALESCE(src.categoria_despesa_id::text, '') = ANY(
      string_to_array(regexp_replace({{categoria_despesa_id}}::text, '[{}[:space:]]', '', 'g'), ',')
    )
  )
  AND (
    NULLIF(regexp_replace({{projeto_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
    OR COALESCE(src.projeto_id::text, '') = ANY(
      string_to_array(regexp_replace({{projeto_id}}::text, '[{}[:space:]]', '', 'g'), ',')
    )
  )
```

## Contrato Query-First

- KPI: query deve retornar `value`
- Chart: query deve retornar `key`, `label`, `value`
- Serie mensal: usar `TO_CHAR(DATE_TRUNC('month', src.data_pedido), 'YYYY-MM')`

## KPIs Canonicos

### Gasto

```sql
SELECT COALESCE(SUM(src.valor_total), 0)::float AS value
FROM compras.compras src
-- + COMPRAS_WHERE
```

### Fornecedores

```sql
SELECT COUNT(DISTINCT src.fornecedor_id)::int AS value
FROM compras.compras src
-- + COMPRAS_WHERE
```

### Pedidos

```sql
SELECT COUNT(DISTINCT src.id)::int AS value
FROM compras.compras src
-- + COMPRAS_WHERE
```

## Graficos Canonicos

### Fornecedores

```sql
SELECT
  COALESCE(src.fornecedor_id, 0)::text AS key,
  COALESCE(f.nome_fantasia, '-') AS label,
  COALESCE(SUM(src.valor_total), 0)::float AS value
FROM compras.compras src
LEFT JOIN entidades.fornecedores f ON f.id = src.fornecedor_id
-- + COMPRAS_WHERE
GROUP BY 1, 2
ORDER BY 3 DESC
```

### Centros de Custo

```sql
SELECT
  COALESCE(src.centro_custo_id, 0)::text AS key,
  COALESCE(cc.nome, '-') AS label,
  COALESCE(SUM(src.valor_total), 0)::float AS value
FROM compras.compras src
LEFT JOIN empresa.centros_custo cc ON cc.id = src.centro_custo_id
-- + COMPRAS_WHERE
GROUP BY 1, 2
ORDER BY 3 DESC
```

### Filiais

```sql
SELECT
  COALESCE(src.filial_id, 0)::text AS key,
  COALESCE(fil.nome, '-') AS label,
  COALESCE(SUM(src.valor_total), 0)::float AS value
FROM compras.compras src
LEFT JOIN empresa.filiais fil ON fil.id = src.filial_id
-- + COMPRAS_WHERE
GROUP BY 1, 2
ORDER BY 3 DESC
```

### Categorias

```sql
SELECT
  COALESCE(src.categoria_despesa_id, 0)::text AS key,
  COALESCE(cd.nome, '-') AS label,
  COALESCE(SUM(src.valor_total), 0)::float AS value
FROM compras.compras src
LEFT JOIN financeiro.categorias_despesa cd ON cd.id = src.categoria_despesa_id
-- + COMPRAS_WHERE
GROUP BY 1, 2
ORDER BY 3 DESC
```

### Projetos

```sql
SELECT
  COALESCE(src.projeto_id, 0)::text AS key,
  COALESCE(pr.nome, '-') AS label,
  COALESCE(SUM(src.valor_total), 0)::float AS value
FROM compras.compras src
LEFT JOIN financeiro.projetos pr ON pr.id = src.projeto_id
-- + COMPRAS_WHERE
GROUP BY 1, 2
ORDER BY 3 DESC
```

### Status (Qtd)

```sql
SELECT
  COALESCE(src.status, '-') AS key,
  COALESCE(src.status, '-') AS label,
  COUNT(*)::int AS value
FROM compras.compras src
-- + COMPRAS_WHERE
GROUP BY 1, 2
ORDER BY 3 DESC
```

### Gasto / Pedidos / Ticket por Mes

```sql
SELECT
  TO_CHAR(DATE_TRUNC('month', src.data_pedido), 'YYYY-MM') AS key,
  TO_CHAR(DATE_TRUNC('month', src.data_pedido), 'YYYY-MM') AS label,
  COALESCE(SUM(src.valor_total), 0)::float AS value
FROM compras.compras src
-- + COMPRAS_WHERE
GROUP BY 1, 2
ORDER BY 2 ASC
```

## Erros Comuns

### Erro de relacao

Correto:
- `compras.compras`

Incorreto:
- `compras_compras`

### Filtros multi-ID nao funcionam

Causa comum:
- enviar string sem tratar formato de array/lista.

Padrao do template:
- usar `regexp_replace` + `string_to_array` + `ANY`.

## Checklist Antes de Entregar SQL

- usar somente tabelas do template atual de Compras
- aplicar tenant + data (`de`/`ate`)
- manter aliases `value` (KPI) e `key/label/value` (Chart)
- manter cast e ordem temporal em series mensais
