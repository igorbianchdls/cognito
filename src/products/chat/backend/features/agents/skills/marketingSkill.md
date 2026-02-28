# Marketing Skill (Contrato de Dados Meta/Google)

Objetivo: mapear corretamente dados de midia paga para `dataQuery` sem inventar campos.

Este skill NAO gera JSONR final de dashboard.
Para dashboard final, usar `dashboard.md`.

## Fronteira

Este skill define:
- models/tabelas
- medidas
- dimensoes
- filtros
- options para slicers
- exemplos de `dataQuery`

Este skill NAO define layout final.

## Fontes de Verdade

- `src/products/erp/backend/features/modulos/controllers/trafegopago/query/controller.ts`
- `src/products/erp/backend/features/modulos/controllers/trafegopago/options/controller.ts`
- `src/products/bi/shared/queryCatalog.ts`

Prioridade em conflito:
1. controller de query/options
2. query catalog

## Model Principal

- `trafegopago.desempenho_diario`

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
- `CASE WHEN SUM(impressoes)=0 THEN 0 ELSE (SUM(gasto)*1000.0)/SUM(impressoes) END` (CPM)
- `CASE WHEN SUM(conversoes)=0 THEN 0 ELSE SUM(gasto)/SUM(conversoes) END` (CPA)
- `CASE WHEN SUM(cliques)=0 THEN 0 ELSE SUM(conversoes)/SUM(cliques) END` (CVR)

## Dimensoes Canonicas

- `plataforma`
- `nivel`
- `conta`, `conta_id`
- `campanha`, `campanha_id`
- `grupo`, `grupo_id`
- `anuncio`, `anuncio_id`
- `mes`, `periodo`

## Referencia Real de Templates (Meta/Google Ads)

Base atual observada em:
- `src/products/bi/shared/templates/appsMetaAdsTemplate.ts`
- `src/products/bi/shared/templates/appsGoogleAdsTemplate.ts`

Dimensoes mais usadas nesses templates:
- `conta_id`
- `campanha_id`
- `grupo_id`
- `anuncio_id`
- `mes`

Medidas mais usadas nesses templates:
- `SUM(gasto)`
- `SUM(receita_atribuida)`
- `SUM(cliques)`
- `SUM(impressoes)`
- `SUM(conversoes)`
- `SUM(leads)`
- `CASE WHEN SUM(gasto)=0 THEN 0 ELSE SUM(receita_atribuida)/SUM(gasto) END`
- `CASE WHEN SUM(impressoes)=0 THEN 0 ELSE SUM(cliques)/SUM(impressoes) END`
- `CASE WHEN SUM(cliques)=0 THEN 0 ELSE SUM(gasto)/SUM(cliques) END`
- `CASE WHEN SUM(impressoes)=0 THEN 0 ELSE (SUM(gasto)*1000.0)/SUM(impressoes) END`
- `CASE WHEN SUM(conversoes)=0 THEN 0 ELSE SUM(gasto)/SUM(conversoes) END`
- `CASE WHEN SUM(cliques)=0 THEN 0 ELSE SUM(conversoes)/SUM(cliques) END`
- `CASE WHEN SUM(cliques)=0 THEN 0 ELSE SUM(leads)/SUM(cliques) END`

## Filtros Canonicos

- `tenant_id`
- `de`, `ate`
- `plataforma` (`meta_ads`, `google_ads`)
- `nivel` (`campaign`, `ad_group`, `ad`)
- `conta_id`, `campanha_id`, `grupo_id`, `anuncio_id`
- `gasto_min`, `gasto_max`

## Options de Slicer

Campos esperados:
- `conta_id`
- `campanha_id`
- `grupo_id`
- `anuncio_id`

Com cascata quando necessario:
- campanha depende de conta
- grupo depende de conta e campanha
- anuncio depende de conta, campanha e grupo

## Mapeamentos Canonicos (exemplos `dataQuery`)

KPI Gasto Meta (campanha):
```json
{
  "model": "trafegopago.desempenho_diario",
  "measure": "SUM(gasto)",
  "filters": { "plataforma": "meta_ads", "nivel": "campaign" }
}
```

KPI CTR Google (campanha):
```json
{
  "model": "trafegopago.desempenho_diario",
  "measure": "CASE WHEN SUM(impressoes)=0 THEN 0 ELSE SUM(cliques)/SUM(impressoes) END",
  "filters": { "plataforma": "google_ads", "nivel": "campaign" }
}
```

Top campanhas por gasto:
```json
{
  "model": "trafegopago.desempenho_diario",
  "dimension": "campanha",
  "measure": "SUM(gasto)",
  "filters": { "nivel": "campaign" },
  "orderBy": { "field": "measure", "dir": "desc" },
  "limit": 10
}
```

Serie mensal de conversoes:
```json
{
  "model": "trafegopago.desempenho_diario",
  "dimension": "mes",
  "measure": "SUM(conversoes)",
  "filters": { "nivel": "campaign" },
  "orderBy": { "field": "dimension", "dir": "asc" },
  "limit": 12
}
```

## Sugestoes de Dashboard (Nao Obrigatorio)

KPIs sugeridos:
- `trafegopago.desempenho_diario` + `SUM(gasto)`
- `trafegopago.desempenho_diario` + `SUM(receita_atribuida)`
- `trafegopago.desempenho_diario` + `SUM(cliques)`
- `trafegopago.desempenho_diario` + `SUM(impressoes)`
- `trafegopago.desempenho_diario` + `SUM(conversoes)`
- `trafegopago.desempenho_diario` + `SUM(leads)`
- `trafegopago.desempenho_diario` + `CASE WHEN SUM(gasto)=0 THEN 0 ELSE SUM(receita_atribuida)/SUM(gasto) END`
- `trafegopago.desempenho_diario` + `CASE WHEN SUM(impressoes)=0 THEN 0 ELSE SUM(cliques)/SUM(impressoes) END`
- `trafegopago.desempenho_diario` + `CASE WHEN SUM(cliques)=0 THEN 0 ELSE SUM(gasto)/SUM(cliques) END`
- `trafegopago.desempenho_diario` + `CASE WHEN SUM(impressoes)=0 THEN 0 ELSE (SUM(gasto)*1000.0)/SUM(impressoes) END`
- `trafegopago.desempenho_diario` + `CASE WHEN SUM(conversoes)=0 THEN 0 ELSE SUM(gasto)/SUM(conversoes) END`
- `trafegopago.desempenho_diario` + `CASE WHEN SUM(cliques)=0 THEN 0 ELSE SUM(conversoes)/SUM(cliques) END`
- `trafegopago.desempenho_diario` + `CASE WHEN SUM(cliques)=0 THEN 0 ELSE SUM(leads)/SUM(cliques) END`

Graficos sugeridos:
- `LineChart`: model `trafegopago.desempenho_diario`, dimension `mes`, measure `SUM(gasto)`
- `LineChart`: model `trafegopago.desempenho_diario`, dimension `mes`, measure `SUM(receita_atribuida)`
- `LineChart`: model `trafegopago.desempenho_diario`, dimension `mes`, measure `CASE WHEN SUM(gasto)=0 THEN 0 ELSE SUM(receita_atribuida)/SUM(gasto) END`
- `LineChart`: model `trafegopago.desempenho_diario`, dimension `mes`, measure `SUM(conversoes)`
- `LineChart`: model `trafegopago.desempenho_diario`, dimension `mes`, measure `SUM(leads)`
- `BarChart`: model `trafegopago.desempenho_diario`, dimension `campanha_id`, measure `SUM(gasto)`
- `BarChart`: model `trafegopago.desempenho_diario`, dimension `campanha_id`, measure `SUM(receita_atribuida)`
- `BarChart`: model `trafegopago.desempenho_diario`, dimension `grupo_id`, measure `SUM(conversoes)`
- `BarChart`: model `trafegopago.desempenho_diario`, dimension `anuncio_id`, measure `SUM(conversoes)`
- `PieChart`: model `trafegopago.desempenho_diario`, dimension `conta_id`, measure `SUM(gasto)`
- `BarChart`: model `trafegopago.desempenho_diario`, dimension `conta_id`, measure `SUM(receita_atribuida)`

Observacao de composicao:
- manter padrao parecido com os templates existentes: varios KPIs e varios graficos;
- filtros hierarquicos (conta -> campanha -> grupo -> anuncio) podem ficar no fim do dashboard.

## Regras Operacionais

- Nao inventar medida/dimensao/filtro fora da whitelist.
- Se metrica pedida nao existir, usar equivalente suportado e explicar.
- Se options de slicer vierem vazias, validar `field`, `dependsOn`, `contextFilters` e tenant.

## Formato de Handoff para Dashboard Skill

```json
{
  "targetPath": "/vercel/sandbox/dashboard/<nome>.jsonr",
  "queries": [
    {
      "id": "kpi_ctr",
      "title": "CTR",
      "dataQuery": {
        "model": "trafegopago.desempenho_diario",
        "measure": "CASE WHEN SUM(impressoes)=0 THEN 0 ELSE SUM(cliques)/SUM(impressoes) END",
        "filters": { "plataforma": "meta_ads", "nivel": "campaign" }
      }
    }
  ],
  "slicerOptions": ["conta_id", "campanha_id", "grupo_id", "anuncio_id"]
}
```

Regra obrigatoria:
- nunca sugerir `/vercel/sandbox/dashboards` (plural)
