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

## Queries de Exploracao (para `sql_execution`)

Estas queries sao para investigacao de performance e diagnostico de midia paga, nao apenas KPI isolado.

Como usar:
- Foram escritas para rodar direto no `sql_execution` (`{{tenant_id}}` + periodo relativo).
- Use para levantar hipotese e encontrar causa raiz de variacao.
- Depois refine com filtros de plataforma/conta/campanha conforme o caso.

### 1) Diagnostico rapido por plataforma (30 dias)
Quando usar: para ver rapidamente onde investimento gera retorno melhor.

```sql
SELECT
  COALESCE(dd.plataforma, 'Sem plataforma') AS key,
  COALESCE(dd.plataforma, 'Sem plataforma') AS label,
  COALESCE(SUM(dd.gasto), 0)::float AS gasto,
  COALESCE(SUM(dd.receita_atribuida), 0)::float AS receita,
  CASE
    WHEN COALESCE(SUM(dd.gasto), 0) = 0 THEN 0
    ELSE COALESCE(SUM(dd.receita_atribuida), 0)::float / NULLIF(SUM(dd.gasto), 0)::float
  END AS value,
  COALESCE(SUM(dd.conversoes), 0)::float AS conversoes
FROM trafegopago.desempenho_diario dd
WHERE dd.tenant_id = {{tenant_id}}::int
  AND dd.data_ref::date >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY 1,2
ORDER BY gasto DESC
```

### 2) Campanhas com alto gasto e baixa eficiencia
Quando usar: para cortar desperdicio e priorizar otimizacao.

```sql
SELECT
  dd.campanha_id AS key,
  COALESCE(c.nome, CONCAT('Campanha #', dd.campanha_id::text)) AS label,
  COALESCE(SUM(dd.gasto), 0)::float AS gasto,
  COALESCE(SUM(dd.conversoes), 0)::float AS conversoes,
  CASE
    WHEN COALESCE(SUM(dd.conversoes), 0) = 0 THEN NULL
    ELSE COALESCE(SUM(dd.gasto), 0)::float / NULLIF(SUM(dd.conversoes), 0)::float
  END AS cpa,
  CASE
    WHEN COALESCE(SUM(dd.gasto), 0) = 0 THEN 0
    ELSE COALESCE(SUM(dd.receita_atribuida), 0)::float / NULLIF(SUM(dd.gasto), 0)::float
  END AS roas
FROM trafegopago.desempenho_diario dd
LEFT JOIN trafegopago.campanhas c ON c.id = dd.campanha_id
WHERE dd.tenant_id = {{tenant_id}}::int
  AND dd.data_ref::date >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY 1,2
HAVING COALESCE(SUM(dd.gasto), 0) > 0
ORDER BY gasto DESC, roas ASC
LIMIT 30
```

### 3) Tendencia semanal de ROAS com variacao
Quando usar: para identificar inflexao de performance antes do fechamento mensal.

```sql
WITH semanal AS (
  SELECT
    DATE_TRUNC('week', dd.data_ref)::date AS semana,
    COALESCE(SUM(dd.gasto), 0)::float AS gasto,
    COALESCE(SUM(dd.receita_atribuida), 0)::float AS receita
  FROM trafegopago.desempenho_diario dd
  WHERE dd.tenant_id = {{tenant_id}}::int
    AND dd.data_ref::date >= CURRENT_DATE - INTERVAL '16 weeks'
  GROUP BY 1
),
serie AS (
  SELECT
    semana,
    gasto,
    receita,
    CASE WHEN gasto = 0 THEN 0 ELSE receita / NULLIF(gasto, 0) END AS roas,
    LAG(CASE WHEN gasto = 0 THEN 0 ELSE receita / NULLIF(gasto, 0) END) OVER (ORDER BY semana) AS roas_semana_anterior
  FROM semanal
)
SELECT
  TO_CHAR(semana, 'YYYY-MM-DD') AS key,
  TO_CHAR(semana, 'YYYY-MM-DD') AS label,
  roas::float AS value,
  roas_semana_anterior,
  CASE
    WHEN COALESCE(roas_semana_anterior, 0) = 0 THEN NULL
    ELSE (roas - roas_semana_anterior) / NULLIF(roas_semana_anterior, 0)
  END AS variacao_pct
FROM serie
ORDER BY semana DESC
```

### 4) Saturacao de audiencia (frequencia vs CTR) por campanha
Quando usar: para achar campanhas com fadiga criativa.

```sql
SELECT
  dd.campanha_id AS key,
  COALESCE(c.nome, CONCAT('Campanha #', dd.campanha_id::text)) AS label,
  COALESCE(AVG(dd.frequencia), 0)::float AS frequencia_media,
  CASE
    WHEN COALESCE(SUM(dd.impressoes), 0) = 0 THEN 0
    ELSE COALESCE(SUM(dd.cliques), 0)::float / NULLIF(SUM(dd.impressoes), 0)::float
  END AS value,
  COALESCE(SUM(dd.impressoes), 0)::float AS impressoes
FROM trafegopago.desempenho_diario dd
LEFT JOIN trafegopago.campanhas c ON c.id = dd.campanha_id
WHERE dd.tenant_id = {{tenant_id}}::int
  AND dd.data_ref::date >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY 1,2
HAVING COALESCE(SUM(dd.impressoes), 0) >= 1000
ORDER BY frequencia_media DESC, value ASC
LIMIT 30
```

### 5) Pareto de gasto por conta (share acumulada)
Quando usar: para entender concentracao de budget e risco de dependencia.

```sql
WITH base AS (
  SELECT
    dd.conta_id,
    COALESCE(cm.nome_conta, CONCAT('Conta #', dd.conta_id::text)) AS conta,
    COALESCE(SUM(dd.gasto), 0)::float AS gasto
  FROM trafegopago.desempenho_diario dd
  LEFT JOIN trafegopago.contas_midia cm ON cm.id = dd.conta_id
  WHERE dd.tenant_id = {{tenant_id}}::int
    AND dd.data_ref::date >= CURRENT_DATE - INTERVAL '90 days'
  GROUP BY 1,2
),
ranked AS (
  SELECT
    *,
    gasto / NULLIF(SUM(gasto) OVER (), 0) AS share_gasto,
    SUM(gasto) OVER (ORDER BY gasto DESC ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW)
      / NULLIF(SUM(gasto) OVER (), 0) AS share_acumulada
  FROM base
)
SELECT
  conta_id AS key,
  conta AS label,
  gasto AS value,
  share_gasto,
  share_acumulada
FROM ranked
ORDER BY gasto DESC
```

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
