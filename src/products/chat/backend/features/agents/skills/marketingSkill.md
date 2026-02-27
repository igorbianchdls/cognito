# Marketing Skill (Media Performance + Dashboards)

Objetivo: orientar implementacoes de analytics e dashboards de marketing pago com dados reais/simulados, usando `trafegopago` no backend BI.

Use este skill quando o pedido envolver:
- Meta Ads / Google Ads / consolidado de midia paga
- schema, tabelas, colunas e metricas de performance
- criacao/ajuste de dashboards em `apps/*`
- query/options controllers e filtros de dashboard

## Fonte de Verdade
- `src/products/bi/shared/queryCatalog.ts`
- `src/products/erp/backend/features/modulos/controllers/trafegopago/query/controller.ts`
- `src/products/erp/backend/features/modulos/controllers/trafegopago/options/controller.ts`

## Schema e Tabelas (Marketing)

### Tabela principal
- `trafegopago.desempenho_diario`
- Colunas essenciais:
  - identificacao: `tenant_id`, `data_ref`, `plataforma`, `nivel`
  - chaves: `conta_id`, `campanha_id`, `grupo_id`, `anuncio_id`
  - performance: `gasto`, `receita_atribuida`, `cliques`, `impressoes`, `conversoes`, `leads`, `alcance`, `frequencia`

### Tabelas dimensionais
- `trafegopago.contas_midia` (`id`, `nome_conta`)
- `trafegopago.campanhas` (`id`, `nome`)
- `trafegopago.grupos_anuncio` (`id`, `nome`)
- `trafegopago.anuncios` (`id`, `nome`)

## Medidas e Dimensoes Suportadas

### Medidas chave (query)
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

### Dimensoes chave
- `plataforma`, `nivel`, `conta`, `conta_id`, `campanha`, `campanha_id`, `grupo`, `grupo_id`, `anuncio`, `anuncio_id`, `mes`/`periodo`

## Filtros de Dashboard
- `de`, `ate`
- `plataforma` (ex.: `meta_ads`, `google_ads`)
- `nivel` (`campaign`, `ad_group`, `ad`)
- `conta_id`, `campanha_id`, `grupo_id`, `anuncio_id`
- `gasto_min`, `gasto_max`

## Como Criar Dashboards (Apps)

### Padrão recomendado
1. Header com `datePicker` e `controlsPosition: right`.
2. Filtros em cards separados (`SlicerCard`) com `type: list` (checkbox).
3. Linha de KPIs executivos (`Gasto`, `Receita`, `ROAS`, `Cliques`, `Conversoes`, `Leads`, `CTR`, `CPC`, `CPM`, `CPA`, `CVR`).
4. Tendencia temporal (`LineChart`) por `mes`.
5. Ranking por conta/campanha/grupo/anuncio (`BarChart`/`PieChart`).
6. `AISummary` com leitura executiva.

### Arquivos alvo comuns
- Template: `src/products/bi/shared/templates/apps<Canal>Template.ts`
- Page: `src/products/bi/features/dashboard-playground/pages/Apps<Canal>Page.tsx`
- Rota: `src/app/apps/<canal>/page.tsx`

## Backend (quando necessario)
- Query endpoint: `/api/modulos/trafegopago/query`
- Options endpoint: `/api/modulos/trafegopago/options`
- Resolver: `/api/modulos/options/resolve` (para `source.type = options`)

## Troubleshooting Rapido
- KPI/Chart zerado: verificar se a `measure` esta no whitelist do query controller.
- Filtro vazio: verificar `options` + `dependsOn` + `contextFilters`.
- Dados nao mudam por data: conferir `filters.de/ate` vindo do `datePicker`.
- Resultado sem plataforma: conferir `filters.plataforma` no template e no `DataProvider` inicial.
