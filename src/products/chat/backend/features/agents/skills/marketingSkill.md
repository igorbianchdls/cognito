# Marketing Skill (SQL Query-First)

Objetivo: definir SQL valido para dashboards de trafego pago (Meta Ads / Google Ads) com `dataQuery.query`.

Este skill NAO gera JSONR final.
Para estrutura final, usar `dashboard_builder`.

## Contrato de Dados

Padrao principal:
- KPI/Chart via `query` puro.
- Chart deve informar `xField` e `yField`.
- Formato legado (`model/measure/dimension`) e fallback tecnico.

## Fontes de Verdade

- `src/products/erp/backend/features/modulos/controllers/trafegopago/query/controller.ts`
- `src/products/erp/backend/features/modulos/controllers/trafegopago/options/controller.ts`
- `src/products/bi/shared/queryCatalog.ts`

Em conflito, priorizar controller.

## Tabela Principal

- `trafegopago.desempenho_diario`

## Campos de Corte Comuns

- `plataforma`
- `nivel`
- `conta_id`
- `campanha_id`
- `grupo_id`
- `anuncio_id`
- `data_referencia`

## Filtros Canonicos

- `{{tenant_id}}`
- `{{de}}`, `{{ate}}`
- `{{plataforma}}`
- `{{nivel}}`
- `{{conta_id}}`
- `{{campanha_id}}`
- `{{grupo_id}}`
- `{{anuncio_id}}`

## Medidas Canonicas

- `SUM(gasto)`
- `SUM(receita_atribuida)`
- `SUM(cliques)`
- `SUM(impressoes)`
- `SUM(conversoes)`
- `SUM(leads)`
- `CASE WHEN SUM(gasto)=0 THEN 0 ELSE SUM(receita_atribuida)/SUM(gasto) END` (ROAS)
- `CASE WHEN SUM(impressoes)=0 THEN 0 ELSE SUM(cliques)/SUM(impressoes) END` (CTR)
- `CASE WHEN SUM(cliques)=0 THEN 0 ELSE SUM(gasto)/SUM(cliques) END` (CPC)

## Exemplo KPI (ROAS)

```sql
SELECT
  CASE WHEN SUM(src.gasto)=0 THEN 0 ELSE SUM(src.receita_atribuida)/SUM(src.gasto) END::float AS value
FROM trafegopago.desempenho_diario src
WHERE src.tenant_id = {{tenant_id}}::int
  AND ({{de}}::date IS NULL OR src.data_referencia::date >= {{de}}::date)
  AND ({{ate}}::date IS NULL OR src.data_referencia::date <= {{ate}}::date)
  AND ({{plataforma}}::text IS NULL OR src.plataforma = {{plataforma}}::text)
```

## Exemplo Chart (Top Campanhas por Gasto)

```sql
SELECT
  src.campanha_id::text AS key,
  COALESCE(src.campanha_nome, src.campanha_id::text, '-') AS label,
  COALESCE(SUM(src.gasto), 0)::float AS value
FROM trafegopago.desempenho_diario src
WHERE src.tenant_id = {{tenant_id}}::int
  AND ({{de}}::date IS NULL OR src.data_referencia::date >= {{de}}::date)
  AND ({{ate}}::date IS NULL OR src.data_referencia::date <= {{ate}}::date)
  AND ({{nivel}}::text IS NULL OR src.nivel = {{nivel}}::text)
GROUP BY 1,2
ORDER BY 3 DESC
```

## Exemplo Serie Mensal (Gasto)

```sql
SELECT
  TO_CHAR(DATE_TRUNC('month', src.data_referencia), 'YYYY-MM') AS key,
  TO_CHAR(DATE_TRUNC('month', src.data_referencia), 'YYYY-MM') AS label,
  COALESCE(SUM(src.gasto), 0)::float AS value
FROM trafegopago.desempenho_diario src
WHERE src.tenant_id = {{tenant_id}}::int
  AND ({{de}}::date IS NULL OR src.data_referencia::date >= {{de}}::date)
  AND ({{ate}}::date IS NULL OR src.data_referencia::date <= {{ate}}::date)
GROUP BY 1,2
ORDER BY 2 ASC
```

## Regras Operacionais

- Nao inventar campos fora do controller/catalog.
- Nao usar conversoes implicitas de tipo em filtros; tipar placeholders.
- Para funil hierarquico, respeitar cascata `conta -> campanha -> grupo -> anuncio`.

## Handoff para dashboard_builder

```json
{
  "widget_type": "kpi",
  "payload": {
    "title": "ROAS",
    "query": "SELECT ... AS value FROM ...",
    "formato": "percent"
  }
}
```
