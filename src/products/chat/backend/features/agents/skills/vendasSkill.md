# Vendas Skill (SQL Query-First para /apps/vendas)

Objetivo: definir SQL valido para KPIs e graficos de vendas no padrao do template `src/products/bi/shared/templates/appsVendasTemplate.ts`.

Este skill NAO monta JSONR completo.
Para estrutura/layout de dashboard, usar `dashboard_builder`.

## Escopo

Use este skill para:
- mapear schema/tabelas/campos de vendas
- montar SQL de KPI e grafico no padrao query-first
- diagnosticar erros comuns de query (ex.: tabela incorreta)

## Escopo Estrito

Este skill cobre somente tabelas e joins usados no template atual de Vendas.
Nao expandir para tabelas fora do template.

## Fonte de Verdade

Prioridade de referencia:
1. `src/products/bi/shared/templates/appsVendasTemplate.ts`
2. `src/products/bi/shared/queryCatalog.ts` (entrada `vendas.pedidos`)

Se houver conflito, priorizar template.

## Sugestao de Estrutura (baseada no template /apps/vendas)

- Use este baseline ao montar plano no `dashboard_builder`.
- Ajuste apenas quando o usuario pedir layout diferente.
- Topo: 1 row com 4 KPIs (Vendas, Pedidos, Ticket Medio, Margem Bruta).
- Bloco 1: 1 row com Canais (pie), Categorias (bar), Filtro de Canais (slicer), Clientes (bar).
- Bloco 2: 1 row com Vendedores, Filiais e Unidades de Negocio (3 bars).
- Bloco 3: 1 row com Faturamento por Mes (line).
- Bloco 4: 1 row com Pedidos por Mes, Ticket Medio por Mes e AISummary.
- Bloco 5: 1 row com Territorios, Servicos/Categorias e Pedidos por Canal (3 bars).
- Regra pratica: manter 4 KPIs no topo; expandir para 5-6 so se houver KPIs realmente uteis.

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

## Erros Comuns

### Erro: `relation "vendas_pedidos" does not exist`

Causa:
- uso de nome fisico incorreto.

Correto:
- `FROM vendas.pedidos p`

Incorreto:
- `FROM vendas_pedidos`

### KPI Vendas = 0 com Pedidos > 0

Possiveis causas:
- `valor_total` nulo/zero no recorte filtrado
- janela de data atual sem faturamento
- tenant incorreto

Checklist:
1. validar `tenant_id`
2. validar recorte `de`/`ate`
3. comparar `SUM(p.valor_total)` com `SUM(pi.subtotal)`

## Checklist Antes de Entregar SQL

- tabela com schema correto (ex.: `vendas.pedidos`)
- filtro de tenant aplicado
- filtro de data no padrao do template
- aliases corretos (`value` ou `key/label/value`)
- joins apenas quando necessarios
