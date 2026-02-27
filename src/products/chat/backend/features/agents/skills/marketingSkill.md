# Marketing Skill (Tabelas, Dimensoes e Metricas)

Objetivo: orientar modelagem e consulta de dados de marketing pago (Meta/Google), com foco em tabelas, colunas, dimensoes e metricas suportadas.

Use este skill quando o pedido envolver:
- schema de marketing
- colunas por nivel (conta/campanha/grupo/anuncio)
- medidas de performance e eficiencia
- filtros suportados em query/options

Nao use este skill para ensinar layout JSON de dashboard.
Para isso, use `dashboard.md`.

## Fonte de Verdade
- `src/products/bi/shared/queryCatalog.ts`
- `src/products/erp/backend/features/modulos/controllers/trafegopago/query/controller.ts`
- `src/products/erp/backend/features/modulos/controllers/trafegopago/options/controller.ts`

## Schema e Tabelas

### Fato principal
- `trafegopago.desempenho_diario`
- Colunas principais:
  - controle: `tenant_id`, `data_ref`, `plataforma`, `nivel`
  - chaves: `conta_id`, `campanha_id`, `grupo_id`, `anuncio_id`
  - metricas brutas: `gasto`, `receita_atribuida`, `cliques`, `impressoes`, `conversoes`, `leads`, `alcance`, `frequencia`

### Dimensoes auxiliares
- `trafegopago.contas_midia` (`id`, `nome_conta`)
- `trafegopago.campanhas` (`id`, `nome`)
- `trafegopago.grupos_anuncio` (`id`, `nome`)
- `trafegopago.anuncios` (`id`, `nome`)

## Medidas Suportadas (query)
- `SUM(gasto)`
- `SUM(receita_atribuida)`
- `SUM(cliques)`
- `SUM(impressoes)`
- `SUM(conversoes)`
- `SUM(leads)`
- `SUM(alcance)`
- `COUNT()`
- `CASE WHEN SUM(gasto)=0 THEN 0 ELSE SUM(receita_atribuida)/SUM(gasto) END` (ROAS)
- `CASE WHEN SUM(impressoes)=0 THEN 0 ELSE SUM(cliques)/SUM(impressoes) END` (CTR)
- `CASE WHEN SUM(cliques)=0 THEN 0 ELSE SUM(gasto)/SUM(cliques) END` (CPC)
- `CASE WHEN SUM(impressoes)=0 THEN 0 ELSE (SUM(gasto)*1000.0)/SUM(impressoes) END` (CPM)
- `CASE WHEN SUM(conversoes)=0 THEN 0 ELSE SUM(gasto)/SUM(conversoes) END` (CPA)
- `CASE WHEN SUM(cliques)=0 THEN 0 ELSE SUM(conversoes)/SUM(cliques) END` (CVR)

## Dimensoes Suportadas
- `plataforma`, `nivel`
- `conta`, `conta_id`
- `campanha`, `campanha_id`
- `grupo`, `grupo_id`
- `anuncio`, `anuncio_id`
- `mes` / `periodo`

## Filtros Suportados
- `tenant_id`
- `de`, `ate`
- `plataforma` (`meta_ads`, `google_ads`)
- `nivel` (`campaign`, `ad_group`, `ad`)
- `conta_id`, `campanha_id`, `grupo_id`, `anuncio_id`
- `gasto_min`, `gasto_max`

## Options (slicers)
Campos de options suportados:
- `conta_id`
- `campanha_id`
- `grupo_id`
- `anuncio_id`

Suporta cascata via `dependsOn`/`contextFilters`.

## Regras Operacionais
- Nao inventar medida/dimensao fora do whitelist.
- Quando a medida nao existir, ajustar para a mais proxima suportada e explicitar.
- Quando slicer vier vazio, validar `options` + `dependsOn` + `contextFilters` + tenant.
