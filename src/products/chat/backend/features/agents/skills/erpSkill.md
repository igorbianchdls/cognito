# ERP Skill (SQL Query-First)

Objetivo: definir SQL valido para widgets de dashboard ERP usando `dataQuery.query`.

Este skill NAO define layout final JSONR.
Para estrutura de dashboard, usar `dashboard_builder`.

## Contrato de Dados

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

Notas:
- KPI: normalmente so precisa `query` (+ `yField` opcional).
- Chart: usar sempre `query`, `xField` e `yField`.
- Formato legado (`model/measure/dimension`) e fallback tecnico, nao padrao.

## Fontes de Verdade

- Controllers de query/options do modulo ERP.
- `src/products/bi/shared/queryCatalog.ts`.
- Templates reais de apps ERP em `src/products/bi/shared/templates/`.

Em conflito, priorizar controller do modulo.

## Tabelas ERP Mais Comuns

- `vendas.pedidos`
- `vendas.pedidos_itens`
- `compras.compras`
- `compras.recebimentos`
- `financeiro.contas_pagar`
- `financeiro.contas_receber`
- `crm.oportunidades`
- `crm.leads`
- `estoque.movimentacoes`
- `estoque.estoques_atual`

## Filtros Canonicos (usar placeholders)

- `{{tenant_id}}`
- `{{de}}`, `{{ate}}`
- `{{cliente_id}}`
- `{{vendedor_id}}`
- `{{filial_id}}`
- `{{canal_venda_id}}`
- `{{categoria_receita_id}}`
- `{{territorio_id}}`
- `{{unidade_negocio_id}}`

Regra:
- Sempre tipar placeholders em comparacoes sensiveis (`::date`, `::int`, `::text`).

## Padroes SQL Recomendados

Faixa de datas:

```sql
AND ({{de}}::date IS NULL OR src.data_pedido::date >= {{de}}::date)
AND ({{ate}}::date IS NULL OR src.data_pedido::date <= {{ate}}::date)
```

Filtro opcional escalar:

```sql
AND ({{cliente_id}}::int IS NULL OR src.cliente_id = {{cliente_id}}::int)
```

Serie mensal:

```sql
SELECT
  TO_CHAR(DATE_TRUNC('month', src.data_pedido), 'YYYY-MM') AS key,
  TO_CHAR(DATE_TRUNC('month', src.data_pedido), 'YYYY-MM') AS label,
  SUM(src.valor_total)::float AS value
...
GROUP BY 1,2
ORDER BY 2 ASC
```

## Exemplo KPI

```sql
SELECT COALESCE(SUM(src.valor_total), 0)::float AS value
FROM vendas.pedidos src
WHERE src.tenant_id = {{tenant_id}}::int
  AND ({{de}}::date IS NULL OR src.data_pedido::date >= {{de}}::date)
  AND ({{ate}}::date IS NULL OR src.data_pedido::date <= {{ate}}::date)
```

## Exemplo Chart (Clientes)

```sql
SELECT
  c.id AS key,
  COALESCE(c.nome_fantasia, '-') AS label,
  COALESCE(SUM(pi.subtotal), 0)::float AS value
FROM vendas.pedidos src
JOIN vendas.pedidos_itens pi ON pi.pedido_id = src.id
LEFT JOIN entidades.clientes c ON c.id = src.cliente_id
WHERE src.tenant_id = {{tenant_id}}::int
  AND ({{de}}::date IS NULL OR src.data_pedido::date >= {{de}}::date)
  AND ({{ate}}::date IS NULL OR src.data_pedido::date <= {{ate}}::date)
GROUP BY 1,2
ORDER BY 3 DESC
```

## Regras Operacionais

- Nao usar `to_jsonb(src)->>'campo'` quando a coluna existe fisicamente.
- Nao adicionar joins sem uso real em SELECT/WHERE/GROUP BY.
- Nao inventar colunas fora do schema real.
- Em caso de duvida de coluna, validar no controller/catalog antes de escrever SQL.

## Handoff para dashboard_builder

Sempre entregar widgets com payload query-first:

```json
{
  "widget_type": "chart",
  "payload": {
    "title": "Clientes",
    "chart_type": "bar",
    "query": "SELECT ...",
    "xField": "label",
    "yField": "value",
    "keyField": "key",
    "formato": "currency"
  }
}
```
