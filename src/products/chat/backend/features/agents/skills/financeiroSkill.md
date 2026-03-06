# Financeiro Skill (SQL Query-First para /apps/financeiro)

Objetivo: definir SQL valido para KPIs e graficos financeiros no padrao do template `src/products/bi/shared/templates/appsFinanceiroTemplate.ts`.

Este skill NAO monta DSL completo.
Para estrutura/layout de dashboard, usar `dashboard_builder`.

## Escopo Estrito

Este skill cobre somente tabelas usadas no template atual de Financeiro:
- `financeiro.contas_pagar`
- `financeiro.contas_receber`

Nao expandir para outras tabelas fora do template.

## Fonte de Verdade

Prioridade de referencia:
1. `src/products/bi/shared/templates/appsFinanceiroTemplate.ts`
2. `src/products/bi/shared/queryCatalog.ts` (entradas de contas a pagar/receber)

Se houver conflito, priorizar template.

## Sugestao de Dashboard (Canonico)

Fonte canonica: `src/products/bi/shared/templates/appsFinanceiroTemplate.ts`.

### KPI (descricao semantica + query literal)

- KPI de Recebidos.

```sql
SELECT
  COALESCE(SUM(src.valor_liquido), 0)::float AS value
FROM financeiro.contas_receber src
WHERE src.tenant_id = {{tenant_id}}
  AND ({{de}}::date IS NULL OR src.data_vencimento::date >= {{de}}::date)
  AND ({{ate}}::date IS NULL OR src.data_vencimento::date <= {{ate}}::date)
```

- KPI de Pagos.

```sql
SELECT
  COALESCE(SUM(src.valor_liquido), 0)::float AS value
FROM financeiro.contas_pagar src
WHERE src.tenant_id = {{tenant_id}}
  AND ({{de}}::date IS NULL OR src.data_vencimento::date >= {{de}}::date)
  AND ({{ate}}::date IS NULL OR src.data_vencimento::date <= {{ate}}::date)
```

- KPI de Geracao de Caixa.

```sql
SELECT
  (
    COALESCE((
      SELECT SUM(r.valor_liquido)
      FROM financeiro.contas_receber r
      WHERE r.tenant_id = {{tenant_id}}
        AND ({{de}}::date IS NULL OR r.data_vencimento::date >= {{de}}::date)
        AND ({{ate}}::date IS NULL OR r.data_vencimento::date <= {{ate}}::date)
    ), 0)
    -
    COALESCE((
      SELECT SUM(p.valor_liquido)
      FROM financeiro.contas_pagar p
      WHERE p.tenant_id = {{tenant_id}}
        AND ({{de}}::date IS NULL OR p.data_vencimento::date >= {{de}}::date)
        AND ({{ate}}::date IS NULL OR p.data_vencimento::date <= {{ate}}::date)
    ), 0)
  )::float AS value
```

- KPI de Titulos em AP.

```sql
SELECT
  COUNT(*)::int AS value
FROM financeiro.contas_pagar src
WHERE src.tenant_id = {{tenant_id}}
  AND ({{de}}::date IS NULL OR src.data_vencimento::date >= {{de}}::date)
  AND ({{ate}}::date IS NULL OR src.data_vencimento::date <= {{ate}}::date)
```

### Chart (descricao semantica + query literal)

- Grafico de AP por Fornecedor.

```sql
SELECT
  COALESCE(src.fornecedor_id, 0)::text AS key,
  COALESCE(src.fornecedor_id::text, '-') AS label,
  COALESCE(SUM(src.valor_liquido), 0)::float AS value
FROM financeiro.contas_pagar src
WHERE src.tenant_id = {{tenant_id}}
  AND ({{de}}::date IS NULL OR src.data_vencimento::date >= {{de}}::date)
  AND ({{ate}}::date IS NULL OR src.data_vencimento::date <= {{ate}}::date)
GROUP BY 1, 2
ORDER BY 3 DESC
LIMIT 8
```

- Grafico de AP por Categoria.

```sql
SELECT
  COALESCE(src.categoria_despesa_id, 0)::text AS key,
  COALESCE(src.categoria_despesa_id::text, '-') AS label,
  COALESCE(SUM(src.valor_liquido), 0)::float AS value
FROM financeiro.contas_pagar src
WHERE src.tenant_id = {{tenant_id}}
  AND ({{de}}::date IS NULL OR src.data_vencimento::date >= {{de}}::date)
  AND ({{ate}}::date IS NULL OR src.data_vencimento::date <= {{ate}}::date)
GROUP BY 1, 2
ORDER BY 3 DESC
LIMIT 8
```

- Grafico de AR por Cliente.

```sql
SELECT
  COALESCE(src.cliente_id, 0)::text AS key,
  COALESCE(src.cliente_id::text, '-') AS label,
  COALESCE(SUM(src.valor_liquido), 0)::float AS value
FROM financeiro.contas_receber src
WHERE src.tenant_id = {{tenant_id}}
  AND ({{de}}::date IS NULL OR src.data_vencimento::date >= {{de}}::date)
  AND ({{ate}}::date IS NULL OR src.data_vencimento::date <= {{ate}}::date)
GROUP BY 1, 2
ORDER BY 3 DESC
LIMIT 8
```

- Grafico de Contas a Receber por Mes.

```sql
SELECT
  TO_CHAR(DATE_TRUNC('month', src.data_vencimento), 'YYYY-MM') AS key,
  TO_CHAR(DATE_TRUNC('month', src.data_vencimento), 'YYYY-MM') AS label,
  COALESCE(SUM(src.valor_liquido), 0)::float AS value
FROM financeiro.contas_receber src
WHERE src.tenant_id = {{tenant_id}}
  AND ({{de}}::date IS NULL OR src.data_vencimento::date >= {{de}}::date)
  AND ({{ate}}::date IS NULL OR src.data_vencimento::date <= {{ate}}::date)
GROUP BY 1, 2
ORDER BY 2 ASC
LIMIT 12
```

- Grafico de Status de AP.

```sql
SELECT
  COALESCE(src.status, '-') AS key,
  COALESCE(src.status, '-') AS label,
  COUNT(*)::int AS value
FROM financeiro.contas_pagar src
WHERE src.tenant_id = {{tenant_id}}
  AND ({{de}}::date IS NULL OR src.data_vencimento::date >= {{de}}::date)
  AND ({{ate}}::date IS NULL OR src.data_vencimento::date <= {{ate}}::date)
GROUP BY 1, 2
ORDER BY 3 DESC
LIMIT 8
```

## Tabelas e Campos Canonicos

### `financeiro.contas_pagar src`
Colunas usadas no template:
- `id`, `tenant_id`, `data_vencimento`, `status`
- `valor_liquido`
- `fornecedor_id`, `categoria_despesa_id`

### `financeiro.contas_receber src`
Colunas usadas no template:
- `id`, `tenant_id`, `data_vencimento`, `status`
- `valor_liquido`
- `cliente_id`

## Filtro Canonico de Financeiro

```sql
WHERE src.tenant_id = {{tenant_id}}
  AND ({{de}}::date IS NULL OR src.data_vencimento::date >= {{de}}::date)
  AND ({{ate}}::date IS NULL OR src.data_vencimento::date <= {{ate}}::date)
```

## Contrato Query-First

- KPI: query deve retornar `value`
- Chart: query deve retornar `key`, `label`, `value`
- Serie mensal: usar `TO_CHAR(DATE_TRUNC('month', src.data_vencimento), 'YYYY-MM')`

## KPIs Canonicos (Template)

### Titulos em AP

```sql
SELECT COUNT(*)::int AS value
FROM financeiro.contas_pagar src
WHERE src.tenant_id = {{tenant_id}}
  AND ({{de}}::date IS NULL OR src.data_vencimento::date >= {{de}}::date)
  AND ({{ate}}::date IS NULL OR src.data_vencimento::date <= {{ate}}::date)
```

## Graficos Canonicos (Template)

### AP por Fornecedor

```sql
SELECT
  COALESCE(src.fornecedor_id, 0)::text AS key,
  COALESCE(src.fornecedor_id::text, '-') AS label,
  COALESCE(SUM(src.valor_liquido), 0)::float AS value
FROM financeiro.contas_pagar src
WHERE src.tenant_id = {{tenant_id}}
  AND ({{de}}::date IS NULL OR src.data_vencimento::date >= {{de}}::date)
  AND ({{ate}}::date IS NULL OR src.data_vencimento::date <= {{ate}}::date)
GROUP BY 1, 2
ORDER BY 3 DESC
LIMIT 8
```

### AP por Categoria

```sql
SELECT
  COALESCE(src.categoria_despesa_id, 0)::text AS key,
  COALESCE(src.categoria_despesa_id::text, '-') AS label,
  COALESCE(SUM(src.valor_liquido), 0)::float AS value
FROM financeiro.contas_pagar src
WHERE src.tenant_id = {{tenant_id}}
  AND ({{de}}::date IS NULL OR src.data_vencimento::date >= {{de}}::date)
  AND ({{ate}}::date IS NULL OR src.data_vencimento::date <= {{ate}}::date)
GROUP BY 1, 2
ORDER BY 3 DESC
LIMIT 8
```

### AR por Cliente

```sql
SELECT
  COALESCE(src.cliente_id, 0)::text AS key,
  COALESCE(src.cliente_id::text, '-') AS label,
  COALESCE(SUM(src.valor_liquido), 0)::float AS value
FROM financeiro.contas_receber src
WHERE src.tenant_id = {{tenant_id}}
  AND ({{de}}::date IS NULL OR src.data_vencimento::date >= {{de}}::date)
  AND ({{ate}}::date IS NULL OR src.data_vencimento::date <= {{ate}}::date)
GROUP BY 1, 2
ORDER BY 3 DESC
LIMIT 8
```

### Contas a Receber por Mes

```sql
SELECT
  TO_CHAR(DATE_TRUNC('month', src.data_vencimento), 'YYYY-MM') AS key,
  TO_CHAR(DATE_TRUNC('month', src.data_vencimento), 'YYYY-MM') AS label,
  COALESCE(SUM(src.valor_liquido), 0)::float AS value
FROM financeiro.contas_receber src
WHERE src.tenant_id = {{tenant_id}}
  AND ({{de}}::date IS NULL OR src.data_vencimento::date >= {{de}}::date)
  AND ({{ate}}::date IS NULL OR src.data_vencimento::date <= {{ate}}::date)
GROUP BY 1, 2
ORDER BY 2 ASC
LIMIT 12
```

### Status de AP

```sql
SELECT
  COALESCE(src.status, '-') AS key,
  COALESCE(src.status, '-') AS label,
  COUNT(*)::int AS value
FROM financeiro.contas_pagar src
WHERE src.tenant_id = {{tenant_id}}
  AND ({{de}}::date IS NULL OR src.data_vencimento::date >= {{de}}::date)
  AND ({{ate}}::date IS NULL OR src.data_vencimento::date <= {{ate}}::date)
GROUP BY 1, 2
ORDER BY 3 DESC
LIMIT 8
```

## Nota de Template

O template financeiro foi escrito em modo legado (`model/dimension/measure`) e migrado para query-first por `migrateTemplateDataQueries`.
Ao criar SQL manual, manter o mesmo comportamento funcional das consultas acima.

## Erros Comuns

### Tabela incorreta

Correto:
- `financeiro.contas_pagar`
- `financeiro.contas_receber`

Incorreto:
- `financeiro_contas_pagar`
- `financeiro_contas_receber`

### Serie mensal inconsistente

Causa comum:
- usar campo de data diferente do template.

Padrao:
- `data_vencimento` com `DATE_TRUNC('month', ...)`.

## Checklist Antes de Entregar SQL

- usar somente `contas_pagar` e `contas_receber` do template atual
- aplicar `tenant_id` e janela `de/ate`
- manter aliases `value` (KPI) e `key/label/value` (Chart)
- manter ordenacao mensal ascendente nas series temporais
