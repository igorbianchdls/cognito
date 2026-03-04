# Marketing Skill (SQL Query-First)

Objetivo: definir SQL valido para dashboards de trafego pago (Meta Ads / Google Ads) usando `dataQuery.query`.

Este skill NAO gera JSONR final.
Para layout e montagem de widgets, usar `dashboard_builder`.

## Fontes de Verdade

Prioridade de referencia:
1. `src/products/erp/backend/features/modulos/controllers/trafegopago/query/controller.ts`
2. `src/products/erp/backend/features/modulos/controllers/trafegopago/options/controller.ts`
3. `src/products/bi/shared/queryCatalog.ts`

Em conflito, priorizar controller.

## Contrato Query-First

- KPI: `query` retornando `value`
- Chart: `query`, `xField`, `yField`, `keyField`
- Evitar modo legado em templates novos

## Modelo Canonico (Schema/Tabela/Colunas)

### `trafegopago.desempenho_diario`
Colunas base (confirmadas):
- `tenant_id`, `data_ref`
- `plataforma`, `nivel`
- `conta_id`, `campanha_id`, `grupo_id`, `anuncio_id`
- `gasto`, `receita_atribuida`, `cliques`, `impressoes`, `conversoes`, `leads`
- `alcance`, `frequencia`

Joins comuns para labels:
- `trafegopago.contas_midia cm`
- `trafegopago.campanhas c`
- `trafegopago.grupos_anuncio ga`
- `trafegopago.anuncios a`

## Filtros Canonicos

- `{{tenant_id}}`
- `{{de}}`, `{{ate}}` (sobre `data_ref`)
- `{{plataforma}}`
- `{{nivel}}`
- `{{conta_id}}`
- `{{campanha_id}}`
- `{{grupo_id}}`
- `{{anuncio_id}}`
- `{{gasto_min}}`, `{{gasto_max}}`

Padrao:

```sql
WHERE src.tenant_id = {{tenant_id}}::int
  AND ({{de}}::date IS NULL OR src.data_ref::date >= {{de}}::date)
  AND ({{ate}}::date IS NULL OR src.data_ref::date <= {{ate}}::date)
```

## KPIs Canonicos

### Gasto
```sql
SELECT COALESCE(SUM(dd.gasto), 0)::float AS value
FROM trafegopago.desempenho_diario dd
WHERE dd.tenant_id = {{tenant_id}}::int
  AND ({{de}}::date IS NULL OR dd.data_ref::date >= {{de}}::date)
  AND ({{ate}}::date IS NULL OR dd.data_ref::date <= {{ate}}::date)
```

### Receita atribuida
```sql
SELECT COALESCE(SUM(dd.receita_atribuida), 0)::float AS value
FROM trafegopago.desempenho_diario dd
WHERE dd.tenant_id = {{tenant_id}}::int
  AND ({{de}}::date IS NULL OR dd.data_ref::date >= {{de}}::date)
  AND ({{ate}}::date IS NULL OR dd.data_ref::date <= {{ate}}::date)
```

### ROAS
```sql
SELECT
  CASE
    WHEN COALESCE(SUM(dd.gasto), 0) = 0 THEN 0
    ELSE COALESCE(SUM(dd.receita_atribuida), 0)::float / NULLIF(SUM(dd.gasto), 0)::float
  END::float AS value
FROM trafegopago.desempenho_diario dd
WHERE dd.tenant_id = {{tenant_id}}::int
  AND ({{de}}::date IS NULL OR dd.data_ref::date >= {{de}}::date)
  AND ({{ate}}::date IS NULL OR dd.data_ref::date <= {{ate}}::date)
```

### CTR
```sql
SELECT
  CASE
    WHEN COALESCE(SUM(dd.impressoes), 0) = 0 THEN 0
    ELSE COALESCE(SUM(dd.cliques), 0)::float / NULLIF(SUM(dd.impressoes), 0)::float
  END::float AS value
FROM trafegopago.desempenho_diario dd
WHERE dd.tenant_id = {{tenant_id}}::int
  AND ({{de}}::date IS NULL OR dd.data_ref::date >= {{de}}::date)
  AND ({{ate}}::date IS NULL OR dd.data_ref::date <= {{ate}}::date)
```

### CPC
```sql
SELECT
  CASE
    WHEN COALESCE(SUM(dd.cliques), 0) = 0 THEN 0
    ELSE COALESCE(SUM(dd.gasto), 0)::float / NULLIF(SUM(dd.cliques), 0)::float
  END::float AS value
FROM trafegopago.desempenho_diario dd
WHERE dd.tenant_id = {{tenant_id}}::int
  AND ({{de}}::date IS NULL OR dd.data_ref::date >= {{de}}::date)
  AND ({{ate}}::date IS NULL OR dd.data_ref::date <= {{ate}}::date)
```

## Graficos Canonicos

### Gasto por mes (line)
```sql
SELECT
  TO_CHAR(DATE_TRUNC('month', dd.data_ref), 'YYYY-MM') AS key,
  TO_CHAR(DATE_TRUNC('month', dd.data_ref), 'YYYY-MM') AS label,
  COALESCE(SUM(dd.gasto), 0)::float AS value
FROM trafegopago.desempenho_diario dd
WHERE dd.tenant_id = {{tenant_id}}::int
  AND ({{de}}::date IS NULL OR dd.data_ref::date >= {{de}}::date)
  AND ({{ate}}::date IS NULL OR dd.data_ref::date <= {{ate}}::date)
GROUP BY 1,2
ORDER BY 2 ASC
```

### Top campanhas por gasto (bar)
```sql
SELECT
  dd.campanha_id AS key,
  COALESCE(c.nome, CONCAT('Campanha #', dd.campanha_id::text)) AS label,
  COALESCE(SUM(dd.gasto), 0)::float AS value
FROM trafegopago.desempenho_diario dd
LEFT JOIN trafegopago.campanhas c ON c.id = dd.campanha_id
WHERE dd.tenant_id = {{tenant_id}}::int
  AND ({{de}}::date IS NULL OR dd.data_ref::date >= {{de}}::date)
  AND ({{ate}}::date IS NULL OR dd.data_ref::date <= {{ate}}::date)
GROUP BY 1,2
ORDER BY 3 DESC
LIMIT 10
```

### ROAS por plataforma (bar)
```sql
SELECT
  COALESCE(dd.plataforma, '-') AS key,
  COALESCE(dd.plataforma, '-') AS label,
  CASE
    WHEN COALESCE(SUM(dd.gasto), 0) = 0 THEN 0
    ELSE COALESCE(SUM(dd.receita_atribuida), 0)::float / NULLIF(SUM(dd.gasto), 0)::float
  END::float AS value
FROM trafegopago.desempenho_diario dd
WHERE dd.tenant_id = {{tenant_id}}::int
  AND ({{de}}::date IS NULL OR dd.data_ref::date >= {{de}}::date)
  AND ({{ate}}::date IS NULL OR dd.data_ref::date <= {{ate}}::date)
GROUP BY 1,2
ORDER BY 3 DESC
```

### Hierarquia de performance (conta/campanha/grupo/anuncio)
Para drill, usar mesma base mudando somente dimensao de agrupamento:
- conta: `dd.conta_id` + `cm.nome_conta`
- campanha: `dd.campanha_id` + `c.nome`
- grupo: `dd.grupo_id` + `ga.nome`
- anuncio: `dd.anuncio_id` + `a.nome`

## Regras Anti-Erro (obrigatorias)

- Campo de data canonico: `data_ref` (nao usar `data_referencia` se nao existir no modelo).
- Dimensao mensal sempre derivada via `DATE_TRUNC('month', data_ref)`.
- Nao usar colunas inventadas fora do catalog/controller.
- Sempre proteger divisao por zero (`NULLIF` ou `CASE`).
- Se precisar de nome de entidade (campanha/grupo/anuncio), usar JOIN em tabela de dimensao.

## Handoff para `dashboard_builder`

```json
{
  "widget_type": "kpi",
  "payload": {
    "title": "ROAS",
    "query": "SELECT ... AS value FROM ...",
    "formato": "number"
  }
}
```
