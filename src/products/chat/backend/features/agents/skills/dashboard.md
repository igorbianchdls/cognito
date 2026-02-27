# Dashboard Skill (JSON Render)

Objetivo: ensinar como criar e editar dashboards em JSON Render com estrutura valida, boa UX e `dataQuery` compativel.

Use este skill quando o pedido envolver:
- criacao/refactor de dashboard em `apps/*`
- estrutura JSON Render (`Theme`, `Header`, `Div`, `KPI`, charts, `SlicerCard`, `AISummary`)
- layout, filtros, interacao de chart e usabilidade
- padronizacao de template/page/route

Nao use este skill para decidir tabelas, dimensoes e metricas de negocio.
Para isso, usar skill de dominio:
- ERP -> `erpSkill.md`
- Marketing -> `marketingSkill.md`
- Ecommerce -> `ecommerceSkill.md`

## Contrato Obrigatorio (Nao Negociavel)

1. Formato de saida obrigatorio: JSONR de arvore (JSON Render), com `type/props/children`.
2. Arquivo obrigatorio em:
   - `/vercel/sandbox/dashboard/<nome>.jsonr`
3. Nunca usar pasta `/vercel/sandbox/dashboards` (plural).
4. Nunca retornar payload BI generico com chaves como:
   - `kpiRow`, `charts`, `tables`, `slicers`, `dataSources`, `metadata`
   sem arvore JSON Render.
5. Raiz obrigatoria:
   - primeiro bloco `Theme`.
6. Extensao obrigatoria:
   - `.jsonr`

Se qualquer item acima falhar, o dashboard deve ser considerado invalido.

## Contrato de DataQuery
- Sempre usar `dataQuery` (nao SQL solto no JSON).
- `model` e `measure` sao obrigatorios.
- `dimension` e opcional; em KPI agregado, evitar `dimension`.
- `filters`, `orderBy`, `limit` conforme objetivo do bloco.
- `dimensionExpr` apenas quando necessario.
- Validar `model/measure/dimension/filter` no catalog/controller antes de finalizar.

## Barra Minima de Qualidade
- Evitar dashboard "basico" com poucos blocos.
- Estrutura minima recomendada:
1. `Header` com `datePicker` funcional.
2. Linha de KPI com 4+ indicadores (quando houver dados suficientes).
3. Filtros em cards separados (`SlicerCard`), nao um card unico com tudo.
4. Pelo menos 1 grafico temporal + 1 grafico de distribuicao/ranking.
5. `AISummary` com espacamento/padding legivel.

## Estrutura Recomendada (JSONR)
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

## Validacao de Schema (Obrigatorio Antes de Entregar)
- Conferir props suportadas por componente no catalogo:
  - `src/products/bi/json-render/catalog.ts`
- Se surgir erro de chave nao reconhecida (`unrecognized_keys`), remover a chave e usar alternativa suportada.
- Para `AISummary`, priorizar ajuste visual via `containerStyle` e `itemTextStyle`.

## Padrao de Arquivos (Apps)
- Template: `src/products/bi/shared/templates/apps<Nome>Template.ts`
- Page: `src/products/bi/features/dashboard-playground/pages/Apps<Nome>Page.tsx`
- Route: `src/app/apps/<slug>/page.tsx`
- Artifact runtime path:
  - `/vercel/sandbox/dashboard/<nome>.jsonr`

## Checklist Final (Obrigatorio)
- JSON valido e renderizavel em JSON Render.
- Primeiro bloco e `Theme`.
- Arquivo salvo em `/vercel/sandbox/dashboard/*.jsonr`.
- Nao existe uso de `/vercel/sandbox/dashboards`.
- Todos os componentes existem no renderer atual.
- `dataQuery.model/measure` validos para o backend.
- Filtros globais funcionando (`dateRange` e slicers).
- Layout responsivo sem cards quebrados.
