import { BiSlicers } from '@/products/bi'

const centroCustoOptionsSource = BiSlicers.createOptionsSource('compras.compras', 'centro_custo_id', 100)

const COMPRAS_WHERE = `
WHERE src.tenant_id = {{tenant_id}}
  AND ({{de}}::date IS NULL OR src.data_pedido::date >= {{de}}::date)
  AND ({{ate}}::date IS NULL OR src.data_pedido::date <= {{ate}}::date)
  AND (
    NULLIF(regexp_replace({{fornecedor_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
    OR COALESCE(src.fornecedor_id::text, '') = ANY(
      string_to_array(regexp_replace({{fornecedor_id}}::text, '[{}[:space:]]', '', 'g'), ',')
    )
  )
  AND (
    NULLIF(regexp_replace({{centro_custo_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
    OR COALESCE(src.centro_custo_id::text, '') = ANY(
      string_to_array(regexp_replace({{centro_custo_id}}::text, '[{}[:space:]]', '', 'g'), ',')
    )
  )
  AND (
    NULLIF(regexp_replace({{filial_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
    OR COALESCE(src.filial_id::text, '') = ANY(
      string_to_array(regexp_replace({{filial_id}}::text, '[{}[:space:]]', '', 'g'), ',')
    )
  )
  AND (
    NULLIF(regexp_replace({{categoria_despesa_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
    OR COALESCE(src.categoria_despesa_id::text, '') = ANY(
      string_to_array(regexp_replace({{categoria_despesa_id}}::text, '[{}[:space:]]', '', 'g'), ',')
    )
  )
  AND (
    NULLIF(regexp_replace({{projeto_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
    OR COALESCE(src.projeto_id::text, '') = ANY(
      string_to_array(regexp_replace({{projeto_id}}::text, '[{}[:space:]]', '', 'g'), ',')
    )
  )
`.trim()

const QUERY_KPI_GASTO = `
SELECT
  COALESCE(SUM(src.valor_total), 0)::float AS value
FROM compras.compras src
${COMPRAS_WHERE}
`.trim()

const QUERY_KPI_FORNECEDORES = `
SELECT
  COUNT(DISTINCT src.fornecedor_id)::int AS value
FROM compras.compras src
${COMPRAS_WHERE}
`.trim()

const QUERY_KPI_PEDIDOS = `
SELECT
  COUNT(DISTINCT src.id)::int AS value
FROM compras.compras src
${COMPRAS_WHERE}
`.trim()

const QUERY_KPI_TRANSACOES = `
SELECT
  COUNT(DISTINCT r.id)::int AS value
FROM compras.recebimentos r
JOIN compras.compras src ON src.id = r.compra_id
${COMPRAS_WHERE}
`.trim()

const QUERY_FORNECEDORES = `
SELECT
  COALESCE(src.fornecedor_id, 0)::text AS key,
  COALESCE(f.nome_fantasia, '-') AS label,
  COALESCE(SUM(src.valor_total), 0)::float AS value
FROM compras.compras src
LEFT JOIN entidades.fornecedores f ON f.id = src.fornecedor_id
${COMPRAS_WHERE}
GROUP BY 1, 2
ORDER BY 3 DESC
`.trim()

const QUERY_CENTROS_CUSTO = `
SELECT
  COALESCE(src.centro_custo_id, 0)::text AS key,
  COALESCE(cc.nome, '-') AS label,
  COALESCE(SUM(src.valor_total), 0)::float AS value
FROM compras.compras src
LEFT JOIN empresa.centros_custo cc ON cc.id = src.centro_custo_id
${COMPRAS_WHERE}
GROUP BY 1, 2
ORDER BY 3 DESC
`.trim()

const QUERY_FILIAIS = `
SELECT
  COALESCE(src.filial_id, 0)::text AS key,
  COALESCE(fil.nome, '-') AS label,
  COALESCE(SUM(src.valor_total), 0)::float AS value
FROM compras.compras src
LEFT JOIN empresa.filiais fil ON fil.id = src.filial_id
${COMPRAS_WHERE}
GROUP BY 1, 2
ORDER BY 3 DESC
`.trim()

const QUERY_CATEGORIAS = `
SELECT
  COALESCE(src.categoria_despesa_id, 0)::text AS key,
  COALESCE(cd.nome, '-') AS label,
  COALESCE(SUM(src.valor_total), 0)::float AS value
FROM compras.compras src
LEFT JOIN financeiro.categorias_despesa cd ON cd.id = src.categoria_despesa_id
${COMPRAS_WHERE}
GROUP BY 1, 2
ORDER BY 3 DESC
`.trim()

const QUERY_PROJETOS = `
SELECT
  COALESCE(src.projeto_id, 0)::text AS key,
  COALESCE(pr.nome, '-') AS label,
  COALESCE(SUM(src.valor_total), 0)::float AS value
FROM compras.compras src
LEFT JOIN financeiro.projetos pr ON pr.id = src.projeto_id
${COMPRAS_WHERE}
GROUP BY 1, 2
ORDER BY 3 DESC
`.trim()

const QUERY_STATUS_QTD = `
SELECT
  COALESCE(src.status, '-') AS key,
  COALESCE(src.status, '-') AS label,
  COUNT(*)::int AS value
FROM compras.compras src
${COMPRAS_WHERE}
GROUP BY 1, 2
ORDER BY 3 DESC
`.trim()

const QUERY_GASTO_MES = `
SELECT
  TO_CHAR(DATE_TRUNC('month', src.data_pedido), 'YYYY-MM') AS key,
  TO_CHAR(DATE_TRUNC('month', src.data_pedido), 'YYYY-MM') AS label,
  COALESCE(SUM(src.valor_total), 0)::float AS value
FROM compras.compras src
${COMPRAS_WHERE}
GROUP BY 1, 2
ORDER BY 2 ASC
`.trim()

const QUERY_PEDIDOS_MES = `
SELECT
  TO_CHAR(DATE_TRUNC('month', src.data_pedido), 'YYYY-MM') AS key,
  TO_CHAR(DATE_TRUNC('month', src.data_pedido), 'YYYY-MM') AS label,
  COUNT(DISTINCT src.id)::int AS value
FROM compras.compras src
${COMPRAS_WHERE}
GROUP BY 1, 2
ORDER BY 2 ASC
`.trim()

const QUERY_TICKET_MES = `
SELECT
  TO_CHAR(DATE_TRUNC('month', src.data_pedido), 'YYYY-MM') AS key,
  TO_CHAR(DATE_TRUNC('month', src.data_pedido), 'YYYY-MM') AS label,
  COALESCE(AVG(src.valor_total), 0)::float AS value
FROM compras.compras src
${COMPRAS_WHERE}
GROUP BY 1, 2
ORDER BY 2 ASC
`.trim()

export const APPS_COMPRAS_TEMPLATE_TEXT = JSON.stringify([
  {
    type: 'Theme',
    props: {
      name: 'light',
      managers: {
        border: {
          style: 'solid',
          width: 1,
          color: '#bfc9d9',
          radius: 8,
          frame: {
            variant: 'hud',
            cornerSize: 8,
            cornerWidth: 1,
          },
        },
      },
    },
    children: [
      {
        type: 'Header',
        props: {
          title: 'Dashboard de Compras',
          subtitle: 'Principais indicadores e cortes',
          align: 'center',
          controlsPosition: 'right',
          datePicker: {
            visible: true,
            mode: 'range',
            position: 'right',
            storePath: 'filters.dateRange',
            actionOnChange: { type: 'refresh_data' },
            style: { padding: 6, fontFamily: 'Barlow', fontSize: 12 },
          },
        },
      },
      {
        type: 'Div',
        props: { direction: 'row', gap: 12, padding: 16, justify: 'start', align: 'start', childGrow: true },
        children: [
          { type: 'KPI', props: { title: 'Gasto', format: 'currency', dataQuery: { query: QUERY_KPI_GASTO, yField: 'value', filters: {} } } },
          { type: 'KPI', props: { title: 'Fornecedores', format: 'number', dataQuery: { query: QUERY_KPI_FORNECEDORES, yField: 'value', filters: {} } } },
          { type: 'KPI', props: { title: 'Pedidos', format: 'number', dataQuery: { query: QUERY_KPI_PEDIDOS, yField: 'value', filters: {} }, valueStyle: { fontSize: 22 } } },
          { type: 'KPI', props: { title: 'Transações', format: 'number', dataQuery: { query: QUERY_KPI_TRANSACOES, yField: 'value', filters: {} } } },
        ],
      },

      {
        type: 'Div',
        props: { direction: 'row', gap: 12, padding: 16, justify: 'start', align: 'start', childGrow: true },
        children: [
          {
            type: 'BarChart',
            props: {
              fr: 1,
              title: 'Fornecedores',
              dataQuery: { query: QUERY_FORNECEDORES, xField: 'label', yField: 'value', keyField: 'key', filters: {}, limit: 8 },
              format: 'currency',
              height: 240,
              nivo: { layout: 'horizontal' },
            },
          },
          {
            type: 'BarChart',
            props: {
              fr: 1,
              title: 'Centros de Custo',
              dataQuery: { query: QUERY_CENTROS_CUSTO, xField: 'label', yField: 'value', keyField: 'key', filters: {}, limit: 8 },
              format: 'currency',
              height: 240,
              nivo: { layout: 'horizontal' },
            },
          },
          {
            type: 'SlicerCard',
            props: {
              fr: 1,
              title: 'Filtro Centro de Custo',
              fields: [
                {
                  label: 'Centro de Custo',
                  type: 'list',
                  storePath: 'filters.centro_custo_id',
                  source: centroCustoOptionsSource,
                  selectAll: true,
                  search: true,
                },
              ],
            },
          },
          {
            type: 'BarChart',
            props: {
              fr: 1,
              title: 'Filiais',
              dataQuery: { query: QUERY_FILIAIS, xField: 'label', yField: 'value', keyField: 'key', filters: {}, limit: 8 },
              format: 'currency',
              height: 240,
              nivo: { layout: 'horizontal' },
            },
          },
        ],
      },

      {
        type: 'Div',
        props: { direction: 'row', gap: 12, padding: 16, justify: 'start', align: 'start', childGrow: true },
        children: [
          {
            type: 'BarChart',
            props: {
              fr: 1,
              title: 'Categorias',
              dataQuery: { query: QUERY_CATEGORIAS, xField: 'label', yField: 'value', keyField: 'key', filters: {}, limit: 8 },
              format: 'currency',
              height: 220,
              nivo: { layout: 'horizontal' },
            },
          },
          {
            type: 'BarChart',
            props: {
              fr: 1,
              title: 'Projetos',
              dataQuery: { query: QUERY_PROJETOS, xField: 'label', yField: 'value', keyField: 'key', filters: {}, limit: 8 },
              format: 'currency',
              height: 220,
              nivo: { layout: 'horizontal' },
            },
          },
          {
            type: 'BarChart',
            props: {
              fr: 1,
              title: 'Status (Qtd)',
              dataQuery: { query: QUERY_STATUS_QTD, xField: 'label', yField: 'value', keyField: 'key', filters: {}, limit: 8 },
              format: 'number',
              height: 220,
              nivo: { layout: 'horizontal' },
            },
          },
        ],
      },

      {
        type: 'PieChart',
        props: {
          fr: 1,
          title: 'Status (Pizza)',
          dataQuery: { query: QUERY_STATUS_QTD, xField: 'label', yField: 'value', keyField: 'key', filters: {}, limit: 8 },
          format: 'number',
          height: 260,
          nivo: { innerRadius: 0.35 },
        },
      },

      {
        type: 'Div',
        props: { direction: 'row', gap: 12, padding: 16, justify: 'start', align: 'start', childGrow: true },
        children: [
          {
            type: 'BarChart',
            props: {
              fr: 1,
              title: 'Gasto por Mês',
              dataQuery: { query: QUERY_GASTO_MES, xField: 'label', yField: 'value', keyField: 'key', filters: {}, limit: 12 },
              format: 'currency',
              height: 220,
              nivo: { layout: 'vertical' },
            },
          },
          {
            type: 'BarChart',
            props: {
              fr: 1,
              title: 'Pedidos por Mês',
              dataQuery: { query: QUERY_PEDIDOS_MES, xField: 'label', yField: 'value', keyField: 'key', filters: {}, limit: 12 },
              format: 'number',
              height: 220,
              nivo: { layout: 'vertical' },
            },
          },
          {
            type: 'BarChart',
            props: {
              fr: 1,
              title: 'Ticket Médio por Mês',
              dataQuery: { query: QUERY_TICKET_MES, xField: 'label', yField: 'value', keyField: 'key', filters: {}, limit: 12 },
              format: 'currency',
              height: 220,
              nivo: { layout: 'vertical' },
            },
          },
          {
            type: 'AISummary',
            props: {
              fr: 1,
              title: 'Insights da IA',
              items: [
                { icon: 'shoppingCart', text: 'Compras concentradas por fornecedor podem aumentar risco de negociação e prazo.' },
                { icon: 'lightbulb', text: 'Centros de custo com maior recorrência merecem revisão de contratos e limites.' },
                { icon: 'triangleAlert', text: 'Itens sem recebimento ou com atraso tendem a impactar o fluxo do período.' },
              ],
            },
          },
        ],
      },
    ],
  },
], null, 2)
