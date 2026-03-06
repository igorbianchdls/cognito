# Vendas Skill (SQL Query-First para /apps/vendas)

Objetivo: definir SQL valido para KPIs e graficos de vendas no padrao do template `src/products/bi/shared/templates/appsVendasTemplate.ts`.

Este skill NAO monta DSL completo.
Para estrutura/layout de dashboard, usar `dashboard_builder`.

## Escopo

Use este skill para:
- mapear schema/tabelas/campos de vendas
- montar SQL de KPI e grafico no padrao query-first
- evitar SQL com nomes fisicos incorretos

## Escopo Estrito

Este skill cobre somente tabelas e joins usados no template atual de Vendas.
Nao expandir para tabelas fora do template.

## Fonte de Verdade

Prioridade de referencia:
1. `src/products/bi/shared/templates/appsVendasTemplate.ts`
2. `src/products/bi/shared/queryCatalog.ts` (entrada `vendas.pedidos`)

Se houver conflito, priorizar template.

## Regra Obrigatoria de Nomes Fisicos

- Use apenas schema/tabelas/campos listados neste skill e no template de vendas.
- Nao deduzir nome fisico a partir de nome semantico (ex.: "cliente", "vendedor", "canal").
- Para vendas:
- tabela base: `vendas.pedidos`
- clientes: `entidades.clientes`
- vendedores: `comercial.vendedores` + `entidades.funcionarios`
- canal no pedido: `p.canal_venda_id` (label via `vendas.canais_venda`)
- Se o nome nao estiver na lista canonica, pare e pergunte antes de montar query.

## Sugestao de Dashboard (Canonico)

Fonte canonica: `src/products/bi/shared/templates/appsVendasTemplate.ts`.

### KPI (descricao semantica + query literal)

- KPI de Vendas.

```sql
SELECT
  COALESCE(SUM(p.valor_total), 0)::float AS value
FROM vendas.pedidos p
WHERE p.tenant_id = {{tenant_id}}
  AND ({{de}} IS NULL OR p.data_pedido::date >= {{de}}::date)
  AND ({{ate}} IS NULL OR p.data_pedido::date <= {{ate}}::date)
  AND ({{canal_venda_id}}::int[] IS NULL OR p.canal_venda_id = ANY({{canal_venda_id}}::int[]))
  AND ({{cliente_id}}::int[] IS NULL OR p.cliente_id = ANY({{cliente_id}}::int[]))
```

- KPI de Pedidos.

```sql
SELECT
  COUNT(DISTINCT p.id)::int AS value
FROM vendas.pedidos p
WHERE p.tenant_id = {{tenant_id}}
  AND ({{de}} IS NULL OR p.data_pedido::date >= {{de}}::date)
  AND ({{ate}} IS NULL OR p.data_pedido::date <= {{ate}}::date)
  AND ({{canal_venda_id}}::int[] IS NULL OR p.canal_venda_id = ANY({{canal_venda_id}}::int[]))
  AND ({{cliente_id}}::int[] IS NULL OR p.cliente_id = ANY({{cliente_id}}::int[]))
```

- KPI de Ticket Médio.

```sql
SELECT
  COALESCE(AVG(p.valor_total), 0)::float AS value
FROM vendas.pedidos p
WHERE p.tenant_id = {{tenant_id}}
  AND ({{de}} IS NULL OR p.data_pedido::date >= {{de}}::date)
  AND ({{ate}} IS NULL OR p.data_pedido::date <= {{ate}}::date)
  AND ({{canal_venda_id}}::int[] IS NULL OR p.canal_venda_id = ANY({{canal_venda_id}}::int[]))
  AND ({{cliente_id}}::int[] IS NULL OR p.cliente_id = ANY({{cliente_id}}::int[]))
```

- KPI de Margem Bruta.

Query: Sem query SQL no template (valuePath: vendas.kpis.margemBruta).

### Slicer (descricao semantica + query literal)

- Slicer de Canal.

```sql
SELECT
  cv.id AS value,
  COALESCE(cv.nome, '-') AS label
FROM vendas.canais_venda cv
ORDER BY 2 ASC
```

- Slicer de Cliente.

```sql
SELECT
  c.id AS value,
  COALESCE(c.nome_fantasia, '-') AS label
FROM entidades.clientes c
WHERE c.tenant_id = {{tenant_id}}
ORDER BY 2 ASC
```

### Chart (descricao semantica + query literal)

- Grafico de Canais.

```sql
SELECT
  cv.id AS key,
  COALESCE(cv.nome, '-') AS label,
  COALESCE(SUM(pi.subtotal), 0)::float AS value
FROM vendas.pedidos p
JOIN vendas.pedidos_itens pi ON pi.pedido_id = p.id
LEFT JOIN vendas.canais_venda cv ON cv.id = p.canal_venda_id
WHERE p.tenant_id = {{tenant_id}}
  AND ({{de}} IS NULL OR p.data_pedido::date >= {{de}}::date)
  AND ({{ate}} IS NULL OR p.data_pedido::date <= {{ate}}::date)
  AND ({{canal_venda_id}}::int[] IS NULL OR p.canal_venda_id = ANY({{canal_venda_id}}::int[]))
  AND ({{cliente_id}}::int[] IS NULL OR p.cliente_id = ANY({{cliente_id}}::int[]))
GROUP BY 1, 2
ORDER BY 3 DESC
```

- Grafico de Categorias.

```sql
SELECT
  cr.id AS key,
  COALESCE(cr.nome, '-') AS label,
  COALESCE(SUM(pi.subtotal), 0)::float AS value
FROM vendas.pedidos p
JOIN vendas.pedidos_itens pi ON pi.pedido_id = p.id
LEFT JOIN financeiro.categorias_receita cr ON cr.id = p.categoria_receita_id
WHERE p.tenant_id = {{tenant_id}}
  AND ({{de}} IS NULL OR p.data_pedido::date >= {{de}}::date)
  AND ({{ate}} IS NULL OR p.data_pedido::date <= {{ate}}::date)
  AND ({{canal_venda_id}}::int[] IS NULL OR p.canal_venda_id = ANY({{canal_venda_id}}::int[]))
  AND ({{cliente_id}}::int[] IS NULL OR p.cliente_id = ANY({{cliente_id}}::int[]))
GROUP BY 1, 2
ORDER BY 3 DESC
```

- Grafico de Clientes.

```sql
SELECT
  c.id AS key,
  COALESCE(c.nome_fantasia, '-') AS label,
  COALESCE(SUM(pi.subtotal), 0)::float AS value
FROM vendas.pedidos p
JOIN vendas.pedidos_itens pi ON pi.pedido_id = p.id
LEFT JOIN entidades.clientes c ON c.id = p.cliente_id
WHERE p.tenant_id = {{tenant_id}}
  AND ({{de}} IS NULL OR p.data_pedido::date >= {{de}}::date)
  AND ({{ate}} IS NULL OR p.data_pedido::date <= {{ate}}::date)
  AND ({{canal_venda_id}}::int[] IS NULL OR p.canal_venda_id = ANY({{canal_venda_id}}::int[]))
  AND ({{cliente_id}}::int[] IS NULL OR p.cliente_id = ANY({{cliente_id}}::int[]))
GROUP BY 1, 2
ORDER BY 3 DESC
```

- Grafico de Vendedores.

```sql
SELECT
  v.id AS key,
  COALESCE(f.nome, '-') AS label,
  COALESCE(SUM(pi.subtotal), 0)::float AS value
FROM vendas.pedidos p
JOIN vendas.pedidos_itens pi ON pi.pedido_id = p.id
LEFT JOIN comercial.vendedores v ON v.id = p.vendedor_id
LEFT JOIN entidades.funcionarios f ON f.id = v.funcionario_id
WHERE p.tenant_id = {{tenant_id}}
  AND ({{de}} IS NULL OR p.data_pedido::date >= {{de}}::date)
  AND ({{ate}} IS NULL OR p.data_pedido::date <= {{ate}}::date)
  AND ({{canal_venda_id}}::int[] IS NULL OR p.canal_venda_id = ANY({{canal_venda_id}}::int[]))
  AND ({{cliente_id}}::int[] IS NULL OR p.cliente_id = ANY({{cliente_id}}::int[]))
GROUP BY 1, 2
ORDER BY 3 DESC
```

- Grafico de Filiais.

```sql
SELECT
  fil.id AS key,
  COALESCE(fil.nome, '-') AS label,
  COALESCE(SUM(pi.subtotal), 0)::float AS value
FROM vendas.pedidos p
JOIN vendas.pedidos_itens pi ON pi.pedido_id = p.id
LEFT JOIN empresa.filiais fil ON fil.id = p.filial_id
WHERE p.tenant_id = {{tenant_id}}
  AND ({{de}} IS NULL OR p.data_pedido::date >= {{de}}::date)
  AND ({{ate}} IS NULL OR p.data_pedido::date <= {{ate}}::date)
  AND ({{canal_venda_id}}::int[] IS NULL OR p.canal_venda_id = ANY({{canal_venda_id}}::int[]))
  AND ({{cliente_id}}::int[] IS NULL OR p.cliente_id = ANY({{cliente_id}}::int[]))
GROUP BY 1, 2
ORDER BY 3 DESC
```

- Grafico de Unidades de Negócio.

```sql
SELECT
  un.id AS key,
  COALESCE(un.nome, '-') AS label,
  COALESCE(SUM(pi.subtotal), 0)::float AS value
FROM vendas.pedidos p
JOIN vendas.pedidos_itens pi ON pi.pedido_id = p.id
LEFT JOIN empresa.unidades_negocio un ON un.id = p.unidade_negocio_id
WHERE p.tenant_id = {{tenant_id}}
  AND ({{de}} IS NULL OR p.data_pedido::date >= {{de}}::date)
  AND ({{ate}} IS NULL OR p.data_pedido::date <= {{ate}}::date)
  AND ({{canal_venda_id}}::int[] IS NULL OR p.canal_venda_id = ANY({{canal_venda_id}}::int[]))
  AND ({{cliente_id}}::int[] IS NULL OR p.cliente_id = ANY({{cliente_id}}::int[]))
GROUP BY 1, 2
ORDER BY 3 DESC
```

- Grafico de Faturamento por Mês.

```sql
SELECT
  TO_CHAR(DATE_TRUNC('month', p.data_pedido), 'YYYY-MM') AS key,
  TO_CHAR(DATE_TRUNC('month', p.data_pedido), 'YYYY-MM') AS label,
  COALESCE(SUM(pi.subtotal), 0)::float AS value
FROM vendas.pedidos p
JOIN vendas.pedidos_itens pi ON pi.pedido_id = p.id
WHERE p.tenant_id = {{tenant_id}}
  AND ({{de}} IS NULL OR p.data_pedido::date >= {{de}}::date)
  AND ({{ate}} IS NULL OR p.data_pedido::date <= {{ate}}::date)
  AND ({{canal_venda_id}}::int[] IS NULL OR p.canal_venda_id = ANY({{canal_venda_id}}::int[]))
  AND ({{cliente_id}}::int[] IS NULL OR p.cliente_id = ANY({{cliente_id}}::int[]))
GROUP BY 1, 2
ORDER BY 2 ASC
```

- Grafico de Pedidos por Mês.

```sql
SELECT
  TO_CHAR(DATE_TRUNC('month', p.data_pedido), 'YYYY-MM') AS key,
  TO_CHAR(DATE_TRUNC('month', p.data_pedido), 'YYYY-MM') AS label,
  COUNT(DISTINCT p.id)::int AS value
FROM vendas.pedidos p
WHERE p.tenant_id = {{tenant_id}}
  AND ({{de}} IS NULL OR p.data_pedido::date >= {{de}}::date)
  AND ({{ate}} IS NULL OR p.data_pedido::date <= {{ate}}::date)
  AND ({{canal_venda_id}}::int[] IS NULL OR p.canal_venda_id = ANY({{canal_venda_id}}::int[]))
  AND ({{cliente_id}}::int[] IS NULL OR p.cliente_id = ANY({{cliente_id}}::int[]))
GROUP BY 1, 2
ORDER BY 2 ASC
```

- Grafico de Ticket Médio por Mês.

```sql
SELECT
  TO_CHAR(DATE_TRUNC('month', p.data_pedido), 'YYYY-MM') AS key,
  TO_CHAR(DATE_TRUNC('month', p.data_pedido), 'YYYY-MM') AS label,
  COALESCE(AVG(p.valor_total), 0)::float AS value
FROM vendas.pedidos p
WHERE p.tenant_id = {{tenant_id}}
  AND ({{de}} IS NULL OR p.data_pedido::date >= {{de}}::date)
  AND ({{ate}} IS NULL OR p.data_pedido::date <= {{ate}}::date)
  AND ({{canal_venda_id}}::int[] IS NULL OR p.canal_venda_id = ANY({{canal_venda_id}}::int[]))
  AND ({{cliente_id}}::int[] IS NULL OR p.cliente_id = ANY({{cliente_id}}::int[]))
GROUP BY 1, 2
ORDER BY 2 ASC
```

- Grafico de Territórios.

```sql
SELECT
  t.id AS key,
  COALESCE(t.nome, '-') AS label,
  COALESCE(SUM(pi.subtotal), 0)::float AS value
FROM vendas.pedidos p
JOIN vendas.pedidos_itens pi ON pi.pedido_id = p.id
LEFT JOIN comercial.territorios t ON t.id = p.territorio_id
WHERE p.tenant_id = {{tenant_id}}
  AND ({{de}} IS NULL OR p.data_pedido::date >= {{de}}::date)
  AND ({{ate}} IS NULL OR p.data_pedido::date <= {{ate}}::date)
  AND ({{canal_venda_id}}::int[] IS NULL OR p.canal_venda_id = ANY({{canal_venda_id}}::int[]))
  AND ({{cliente_id}}::int[] IS NULL OR p.cliente_id = ANY({{cliente_id}}::int[]))
GROUP BY 1, 2
ORDER BY 3 DESC
```

- Grafico de Serviços/Categorias.

```sql
SELECT
  cr.id AS key,
  COALESCE(cr.nome, '-') AS label,
  COALESCE(SUM(pi.subtotal), 0)::float AS value
FROM vendas.pedidos p
JOIN vendas.pedidos_itens pi ON pi.pedido_id = p.id
LEFT JOIN financeiro.categorias_receita cr ON cr.id = p.categoria_receita_id
WHERE p.tenant_id = {{tenant_id}}
  AND ({{de}} IS NULL OR p.data_pedido::date >= {{de}}::date)
  AND ({{ate}} IS NULL OR p.data_pedido::date <= {{ate}}::date)
  AND ({{canal_venda_id}}::int[] IS NULL OR p.canal_venda_id = ANY({{canal_venda_id}}::int[]))
  AND ({{cliente_id}}::int[] IS NULL OR p.cliente_id = ANY({{cliente_id}}::int[]))
GROUP BY 1, 2
ORDER BY 3 DESC
```

- Grafico de Pedidos.

```sql
SELECT
  cv.id AS key,
  COALESCE(cv.nome, '-') AS label,
  COUNT(DISTINCT p.id)::int AS value
FROM vendas.pedidos p
LEFT JOIN vendas.canais_venda cv ON cv.id = p.canal_venda_id
WHERE p.tenant_id = {{tenant_id}}
  AND ({{de}} IS NULL OR p.data_pedido::date >= {{de}}::date)
  AND ({{ate}} IS NULL OR p.data_pedido::date <= {{ate}}::date)
  AND ({{canal_venda_id}}::int[] IS NULL OR p.canal_venda_id = ANY({{canal_venda_id}}::int[]))
  AND ({{cliente_id}}::int[] IS NULL OR p.cliente_id = ANY({{cliente_id}}::int[]))
GROUP BY 1, 2
ORDER BY 3 DESC
```
## Tabelas e Campos Canonicos

### `vendas.pedidos p`
Colunas usadas no template:
- `id`, `tenant_id`, `data_pedido`, `status`
- `valor_total`
- `cliente_id`, `vendedor_id`, `canal_venda_id`
- `filial_id`, `unidade_negocio_id`, `territorio_id`, `categoria_receita_id`

### `vendas.pedidos_itens pi`
Colunas usadas no template:
- `pedido_id`
- `subtotal`

### Lookups usados no template
- `vendas.canais_venda cv` (`id`, `nome`)
- `financeiro.categorias_receita cr` (`id`, `nome`)
- `entidades.clientes c` (`id`, `nome_fantasia`)
- `comercial.vendedores v` + `entidades.funcionarios f`
- `empresa.filiais fil`
- `empresa.unidades_negocio un`
- `comercial.territorios t`

## Joins Canonicos

```sql
JOIN vendas.pedidos_itens pi ON pi.pedido_id = p.id
LEFT JOIN vendas.canais_venda cv ON cv.id = p.canal_venda_id
LEFT JOIN financeiro.categorias_receita cr ON cr.id = p.categoria_receita_id
LEFT JOIN entidades.clientes c ON c.id = p.cliente_id
LEFT JOIN comercial.vendedores v ON v.id = p.vendedor_id
LEFT JOIN entidades.funcionarios f ON f.id = v.funcionario_id
LEFT JOIN empresa.filiais fil ON fil.id = p.filial_id
LEFT JOIN empresa.unidades_negocio un ON un.id = p.unidade_negocio_id
LEFT JOIN comercial.territorios t ON t.id = p.territorio_id
```

## Filtro Canonico de Vendas

```sql
WHERE p.tenant_id = {{tenant_id}}
  AND ({{de}} IS NULL OR p.data_pedido::date >= {{de}}::date)
  AND ({{ate}} IS NULL OR p.data_pedido::date <= {{ate}}::date)
```

## Contrato Query-First

- KPI: query deve retornar `value`
- Chart: query deve retornar `key`, `label`, `value`
- Serie mensal: usar
  - `TO_CHAR(DATE_TRUNC('month', p.data_pedido), 'YYYY-MM')`

## KPIs Canonicos

### Vendas (faturamento do pedido)

```sql
SELECT
  COALESCE(SUM(p.valor_total), 0)::float AS value
FROM vendas.pedidos p
WHERE p.tenant_id = {{tenant_id}}
  AND ({{de}} IS NULL OR p.data_pedido::date >= {{de}}::date)
  AND ({{ate}} IS NULL OR p.data_pedido::date <= {{ate}}::date)
```

### Pedidos

```sql
SELECT
  COUNT(DISTINCT p.id)::int AS value
FROM vendas.pedidos p
WHERE p.tenant_id = {{tenant_id}}
  AND ({{de}} IS NULL OR p.data_pedido::date >= {{de}}::date)
  AND ({{ate}} IS NULL OR p.data_pedido::date <= {{ate}}::date)
```

### Ticket Medio

```sql
SELECT
  COALESCE(AVG(p.valor_total), 0)::float AS value
FROM vendas.pedidos p
WHERE p.tenant_id = {{tenant_id}}
  AND ({{de}} IS NULL OR p.data_pedido::date >= {{de}}::date)
  AND ({{ate}} IS NULL OR p.data_pedido::date <= {{ate}}::date)
```

## Graficos Canonicos

### Faturamento por Mes (LineChart)

```sql
SELECT
  TO_CHAR(DATE_TRUNC('month', p.data_pedido), 'YYYY-MM') AS key,
  TO_CHAR(DATE_TRUNC('month', p.data_pedido), 'YYYY-MM') AS label,
  COALESCE(SUM(pi.subtotal), 0)::float AS value
FROM vendas.pedidos p
JOIN vendas.pedidos_itens pi ON pi.pedido_id = p.id
WHERE p.tenant_id = {{tenant_id}}
  AND ({{de}} IS NULL OR p.data_pedido::date >= {{de}}::date)
  AND ({{ate}} IS NULL OR p.data_pedido::date <= {{ate}}::date)
GROUP BY 1, 2
ORDER BY 2 ASC
```

### Pedidos por Mes (BarChart)

```sql
SELECT
  TO_CHAR(DATE_TRUNC('month', p.data_pedido), 'YYYY-MM') AS key,
  TO_CHAR(DATE_TRUNC('month', p.data_pedido), 'YYYY-MM') AS label,
  COUNT(DISTINCT p.id)::int AS value
FROM vendas.pedidos p
WHERE p.tenant_id = {{tenant_id}}
  AND ({{de}} IS NULL OR p.data_pedido::date >= {{de}}::date)
  AND ({{ate}} IS NULL OR p.data_pedido::date <= {{ate}}::date)
GROUP BY 1, 2
ORDER BY 2 ASC
```

### Vendas por Canal (Pie/Bar)

```sql
SELECT
  cv.id AS key,
  COALESCE(cv.nome, '-') AS label,
  COALESCE(SUM(pi.subtotal), 0)::float AS value
FROM vendas.pedidos p
JOIN vendas.pedidos_itens pi ON pi.pedido_id = p.id
LEFT JOIN vendas.canais_venda cv ON cv.id = p.canal_venda_id
WHERE p.tenant_id = {{tenant_id}}
  AND ({{de}} IS NULL OR p.data_pedido::date >= {{de}}::date)
  AND ({{ate}} IS NULL OR p.data_pedido::date <= {{ate}}::date)
GROUP BY 1, 2
ORDER BY 3 DESC
```

## Exemplos do Template (/apps/vendas)

Fonte: `src/products/bi/shared/templates/appsVendasTemplate.ts`

- KPIs do template:
- `QUERY_KPI_VENDAS` (Vendas)
- `QUERY_KPI_PEDIDOS` (Pedidos)
- `QUERY_KPI_TICKET_MEDIO` (Ticket Medio)
- Grafico/serie do template:
- `QUERY_CANAIS` (Canais)
- `QUERY_CATEGORIAS` (Categorias)
- `QUERY_CLIENTES` (Clientes)
- `QUERY_VENDEDORES` (Vendedores)
- `QUERY_FILIAIS` (Filiais)
- `QUERY_UNIDADES` (Unidades de Negocio)
- `QUERY_TERRITORIOS` (Territorios)
- `QUERY_FATURAMENTO_MES` (Faturamento por Mes)
- `QUERY_PEDIDOS_MES` (Pedidos por Mes)
- `QUERY_TICKET_MES` (Ticket Medio por Mes)
- `QUERY_PEDIDOS_POR_CANAL` (Pedidos por Canal)

## Checklist Antes de Entregar SQL

- tabela com schema correto (ex.: `vendas.pedidos`)
- joins/lookups com schema correto (`entidades/comercial/empresa/financeiro`) conforme lista canonica
- filtro de tenant aplicado
- filtro de data no padrao do template
- aliases corretos (`value` ou `key/label/value`)
- joins apenas quando necessarios
