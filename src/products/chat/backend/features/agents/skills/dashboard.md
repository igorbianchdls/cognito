# Dashboard Skill (JSON Render)

Objetivo: ensinar como criar e editar dashboards JSON Render com estrutura valida, boa UX e dataQuery compativel.

Use este skill quando o pedido envolver:
- criacao ou refactor de dashboard em `apps/*`
- estrutura JSON (`Theme`, `Header`, `Div`, `KPI`, charts, `SlicerCard`, `AISummary`)
- layout, filtros, interacao de chart e usabilidade
- padronizacao de template/page/route

Nao use este skill para decidir tabelas, dimensoes e metricas de negocio.
Para dados ERP use `erpSkill.md`.
Para dados de marketing use `marketingSkill.md`.
Para dados de ecommerce use `ecommerceSkill.md`.

## Contrato de Dados
- Sempre usar `dataQuery` (nao SQL puro no JSON).
- `model` e `measure` sao obrigatorios.
- `dimension` e opcional; em KPI agregado nao usar `dimension`.
- `filters`, `orderBy`, `limit` conforme objetivo do card.
- `dimensionExpr` apenas quando necessario.

## Barra Minima de Qualidade
- Evitar dashboard "basico" com poucos blocos.
- Estrutura minima recomendada:
1. `Header` com `datePicker` funcional.
2. Linha de KPI com 4+ indicadores (quando houver dados suficientes).
3. Filtros em cards separados (`SlicerCard`), nao um card unico com tudo.
4. Pelo menos 1 grafico temporal + 1 grafico de distribuicao/ranking.
5. `AISummary` com espacamento/padding legivel.

## Estrutura Recomendada do Dashboard
1. `Theme` na raiz.
2. `Header` com titulo/subtitulo e `datePicker` quando temporal.
3. Linha de KPIs executivos.
4. Linha de filtros (`SlicerCard`) em cards separados.
5. Blocos de distribuicao (`BarChart`/`PieChart`).
6. Blocos temporais (`LineChart`/`BarChart` por mes/periodo).
7. `AISummary` como leitura executiva.

## Componentes e Regras

### Theme
- Definir `props.name` e `managers` (border/color).
- Manter visual consistente entre cards/charts.

### Header
- Usar `controlsPosition: right` por padrao.
- `datePicker.storePath`: `filters.dateRange`.
- `actionOnChange`: `{ type: 'refresh_data' }`.

### Div
- Layout principal com `direction: row`, `wrap: true`, `childGrow: true`.
- Defaults recomendados: `gap: 12`, `padding: 16`.

### KPI
- `dataQuery` sem `dimension` para agregados.
- `format` coerente: `currency`, `number`, `percent`.

### BarChart / PieChart / LineChart
- Ranking: `orderBy.measure = desc`, `limit` 5-12.
- Serie temporal: `orderBy.dimension = asc`.
- Definir `height` (220-260) para estabilidade visual.
- Clique para filtro global quando fizer sentido:
  - `interaction.clickAsFilter`
  - `interaction.filterField`
  - `interaction.storePath`

### SlicerCard
- Preferir `fields[].type = 'list'` (checkbox) para multiselecao.
- Usar `source.type = 'options'` com `model` e `field`.
- Para cascata, configurar `dependsOn`.
- Quando options vier vazio, revisar: `model`, `field`, `dependsOn`, `contextFilters`, `tenant_id`.

### AISummary
- Usar como resumo/alerta executivo.
- Nao substituir KPI/chart.
- Ajustar paddings para boa leitura (`containerStyle`, `itemTextStyle`).

## Validacao de Schema (obrigatorio antes de entregar)
- Conferir props suportadas por componente no catalogo:
  - `src/products/bi/json-render/catalog.ts`
- Se surgir erro de chave nao reconhecida (`unrecognized_keys`), remover a chave e usar alternativa suportada.
- Para `AISummary`, priorizar ajuste visual via `containerStyle` e `itemTextStyle`.

## Padrao de Arquivos (Apps)
- Template: `src/products/bi/shared/templates/apps<Nome>Template.ts`
- Page: `src/products/bi/features/dashboard-playground/pages/Apps<Nome>Page.tsx`
- Route: `src/app/apps/<slug>/page.tsx`

## Checklist Antes de Entregar
- JSON valido e renderizavel.
- Todos os componentes existem no renderer atual.
- `dataQuery.model/measure` validos para o backend.
- Filtros globais funcionando (`dateRange` e slicers).
- Layout responsivo sem cards quebrados.
