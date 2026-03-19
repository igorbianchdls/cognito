'use client'

import React, { isValidElement, ReactNode } from 'react'

type MarkerProps = {
  children?: ReactNode
  id?: string
  name?: string
  title?: string
}

type BarChartMarkerProps = {
  colorScheme?: string[]
  dataQuery?: Record<string, unknown>
  format?: 'currency' | 'number' | 'percent'
  height?: number
  interaction?: Record<string, unknown>
  recharts?: Record<string, unknown>
}

type LineChartMarkerProps = BarChartMarkerProps
type PieChartMarkerProps = BarChartMarkerProps
type WidgetMarkerProps = {
  [key: string]: unknown
}

type DashboardMetric = {
  label: string
  note: string
  value: string
}

type DashboardVariantConfig = {
  badge: string
  eyebrow: string
  fileName: string
  footer: string
  name: string
  path: string
  priorities: string[]
  subtitle: string
  summary: string
  title: string
  metrics: DashboardMetric[]
}

type DashboardTreeNode = {
  type: string
  props: Record<string, unknown>
  children: Array<DashboardTreeNode | string>
}

export type DashboardTemplateVariant = {
  content: string
  name: string
  path: string
  tree: DashboardTreeNode
}

function DashboardTemplateMarker({ children }: MarkerProps) {
  return <>{children}</>
}

function ThemeMarker(_: MarkerProps) {
  return null
}

function DashboardMarker({ children }: MarkerProps) {
  return <>{children}</>
}

function BarChartMarker(_: BarChartMarkerProps) {
  return null
}

function LineChartMarker(_: LineChartMarkerProps) {
  return null
}

function PieChartMarker(_: PieChartMarkerProps) {
  return null
}

function KpiMarker(_: WidgetMarkerProps) {
  return null
}

function TableMarker(_: WidgetMarkerProps) {
  return null
}

function PivotTableMarker(_: WidgetMarkerProps) {
  return null
}

function SlicerMarker(_: WidgetMarkerProps) {
  return null
}

function DatePickerMarker(_: WidgetMarkerProps) {
  return null
}

DashboardTemplateMarker.displayName = 'DashboardTemplate'
ThemeMarker.displayName = 'Theme'
DashboardMarker.displayName = 'Dashboard'
BarChartMarker.displayName = 'BarChart'
LineChartMarker.displayName = 'LineChart'
PieChartMarker.displayName = 'PieChart'
KpiMarker.displayName = 'KPI'
TableMarker.displayName = 'Table'
PivotTableMarker.displayName = 'PivotTable'
SlicerMarker.displayName = 'Slicer'
DatePickerMarker.displayName = 'DatePicker'

const DASHBOARD_VARIANTS: DashboardVariantConfig[] = [
  {
    badge: 'Commercial Pulse',
    eyebrow: 'Q1 2026 Sales Overview',
    fileName: 'dashboard-vendas.tsx',
    footer: 'JSX dashboard baseline with filters, charts and tabular widgets restored on top of the new runtime.',
    name: 'dashboard_vendas',
    path: 'app/dashboard-vendas.tsx',
    priorities: [
      'Review topline revenue performance and compare against target pacing.',
      'Check which channels are carrying the strongest conversion momentum.',
      'Align weekly operating actions before reintroducing richer BI widgets.',
    ],
    subtitle: 'Resumo comercial com foco em clareza visual e narrativa executiva.',
    summary:
      'The dashboard keeps the JSX-first structure, but now reconnects the BI widgets that matter most: filters, charts and tabular analysis.',
    title: 'Dashboard de Vendas',
    metrics: [
      { label: 'Receita do periodo', note: 'vs. forecast mensal', value: 'R$ 4,8M' },
      { label: 'Pipeline ativo', note: 'oportunidades em negociacao', value: '126 deals' },
      { label: 'Conversao media', note: 'margem comercial atual', value: '18,4%' },
    ],
  },
  {
    badge: 'Executive Review',
    eyebrow: 'Leadership Snapshot',
    fileName: 'dashboard-executivo.tsx',
    footer: 'Executive dashboard now keeps the JSX runtime while reconnecting interactive BI controls and widgets.',
    name: 'dashboard_executivo',
    path: 'app/dashboard-executivo.tsx',
    priorities: [
      'Keep the leadership summary concise enough for a quick read.',
      'Highlight the few operational questions that actually require escalation.',
      'Preserve a layout that remains stable while the runtime migrates away from DSL strings.',
    ],
    subtitle: 'Visao geral dos principais resultados para lideranca e acompanhamento semanal.',
    summary:
      'This executive view stays semantic and predictable, while bringing back the interactive controls leaders actually need during review.',
    title: 'Dashboard Executivo',
    metrics: [
      { label: 'Resultado consolidado', note: 'receita liquida acumulada', value: 'R$ 9,2M' },
      { label: 'Contas prioritarias', note: 'clientes com maior impacto', value: '24 contas' },
      { label: 'Risco operacional', note: 'itens que pedem atencao', value: '3 alertas' },
    ],
  },
  {
    badge: 'Ops Focus',
    eyebrow: 'Operational Monitoring',
    fileName: 'dashboard-operacoes.tsx',
    footer: 'Operations dashboard on JSX runtime with query-driven charts, tables and filters wired back in.',
    name: 'dashboard_operacoes',
    path: 'app/dashboard-operacoes.tsx',
    priorities: [
      'Track the execution baseline with readable blocks instead of dense widget grids.',
      'Expose blockers, pending actions and owner responsibilities in plain language.',
      'Stabilize runtime behavior before adding back live operational widgets.',
    ],
    subtitle: 'Acompanhamento operacional e produtividade com layout simples e deterministico.',
    summary:
      'The operations dashboard keeps the parser out of the way and proves the JSX runtime can host the existing BI widgets directly.',
    title: 'Dashboard de Operacoes',
    metrics: [
      { label: 'Tickets resolvidos', note: 'janela semanal consolidada', value: '842 itens' },
      { label: 'SLAs no prazo', note: 'atendimento dentro da meta', value: '96,1%' },
      { label: 'Capacidade disponivel', note: 'time alocado para backlog', value: '14 squads' },
    ],
  },
]

const SALES_CHANNEL_QUERY = `
  SELECT
    COALESCE(cv.id::text, COALESCE(cv.nome, '-')) AS key,
    COALESCE(cv.nome, '-') AS label,
    COALESCE(SUM(pi.subtotal), 0)::float AS value
  FROM vendas.pedidos p
  JOIN vendas.pedidos_itens pi ON pi.pedido_id = p.id
  LEFT JOIN vendas.canais_venda cv ON cv.id = p.canal_venda_id
  WHERE 1=1
    {{filters:p}}
  GROUP BY 1, 2
  ORDER BY 3 DESC
`

const SALES_CHANNEL_DATA_QUERY = {
  query: SALES_CHANNEL_QUERY,
  xField: 'label',
  yField: 'value',
  keyField: 'key',
  dimension: 'canal_venda',
  limit: 6,
}

const SALES_CHANNEL_INTERACTION = {
  table: 'vendas.pedidos',
  field: 'canal_venda_id',
  clearOnSecondClick: true,
}

const SALES_TREND_QUERY = `
  SELECT
    TO_CHAR(p.data_pedido::date, 'YYYY-MM-DD') AS key,
    TO_CHAR(p.data_pedido::date, 'DD/MM') AS label,
    COALESCE(SUM(p.valor_total), 0)::float AS value
  FROM vendas.pedidos p
  WHERE 1=1
    {{filters:p}}
  GROUP BY 1, 2
  ORDER BY 1 ASC
`

const SALES_TREND_DATA_QUERY = {
  query: SALES_TREND_QUERY,
  xField: 'label',
  yField: 'value',
  keyField: 'key',
  limit: 31,
}

const TOTAL_REVENUE_KPI_DATA_QUERY = {
  query: `
    SELECT
      COALESCE(SUM(p.valor_total), 0)::float AS value
    FROM vendas.pedidos p
    WHERE 1=1
      {{filters:p}}
  `,
  limit: 1,
}

const TOTAL_ORDERS_KPI_DATA_QUERY = {
  query: `
    SELECT
      COUNT(*)::float AS value
    FROM vendas.pedidos p
    WHERE 1=1
      {{filters:p}}
  `,
  limit: 1,
}

const AVG_TICKET_KPI_DATA_QUERY = {
  query: `
    SELECT
      COALESCE(AVG(p.valor_total), 0)::float AS value
    FROM vendas.pedidos p
    WHERE 1=1
      {{filters:p}}
  `,
  limit: 1,
}

const CHANNEL_SLICER_QUERY = `
  SELECT
    cv.id::text AS value,
    COALESCE(cv.nome, '-') AS label
  FROM vendas.canais_venda cv
  ORDER BY 2 ASC
`

const ORDERS_TABLE_QUERY = `
  SELECT
    p.id::text AS pedido_id,
    TO_CHAR(p.data_pedido::date, 'DD/MM/YYYY') AS data_pedido,
    COALESCE(cv.nome, '-') AS canal,
    COALESCE(p.status, 'Sem status') AS status,
    COALESCE(p.valor_total, 0)::float AS valor_total
  FROM vendas.pedidos p
  LEFT JOIN vendas.canais_venda cv ON cv.id = p.canal_venda_id
  WHERE 1=1
    {{filters:p}}
  ORDER BY p.data_pedido DESC NULLS LAST, p.id DESC
`

const ORDERS_TABLE_DATA_QUERY = {
  query: ORDERS_TABLE_QUERY,
  limit: 12,
}

const ORDERS_TABLE_COLUMNS = [
  { accessorKey: 'pedido_id', header: 'Pedido' },
  { accessorKey: 'data_pedido', header: 'Data' },
  { accessorKey: 'canal', header: 'Canal' },
  { accessorKey: 'status', header: 'Status', cell: 'badge', meta: { variantMap: { aprovado: 'success', pendente: 'warning', cancelado: 'danger' } } },
  { accessorKey: 'valor_total', header: 'Receita', format: 'currency', align: 'right', headerAlign: 'right' },
]

const SALES_PIVOT_QUERY = `
  SELECT
    COALESCE(cv.nome, '-') AS canal,
    COALESCE(p.status, 'Sem status') AS status,
    COALESCE(p.valor_total, 0)::float AS valor_total
  FROM vendas.pedidos p
  LEFT JOIN vendas.canais_venda cv ON cv.id = p.canal_venda_id
  WHERE 1=1
    {{filters:p}}
`

const SALES_PIVOT_DATA_QUERY = {
  query: SALES_PIVOT_QUERY,
  limit: 400,
}

const SALES_PIVOT_ROWS = [{ field: 'canal', label: 'Canal' }]
const SALES_PIVOT_COLUMNS = [{ field: 'status', label: 'Status' }]
const SALES_PIVOT_VALUES = [{ field: 'valor_total', label: 'Receita', aggregate: 'sum', format: 'currency' }]

function getElementTypeName(type: unknown): string {
  if (typeof type === 'string') return type
  if (typeof type === 'function') {
    const componentType = type as Function & { displayName?: string }
    return componentType.displayName || componentType.name || 'Anonymous'
  }
  return 'Unknown'
}

function jsxToTree(node: ReactNode): DashboardTreeNode | string | null {
  if (node == null || typeof node === 'boolean') return null
  if (typeof node === 'string' || typeof node === 'number') return String(node)
  if (!isValidElement(node)) return null

  const props = (node.props || {}) as { children?: ReactNode } & Record<string, unknown>
  const { children, ...restProps } = props
  const childNodes = Array.isArray(children) ? children : children == null ? [] : [children]
  const parsedChildren = childNodes
    .map((child) => jsxToTree(child))
    .filter((child): child is DashboardTreeNode | string => child !== null)

  return {
    type: getElementTypeName(node.type),
    props: restProps,
    children: parsedChildren,
  }
}

function buildMetricCardsSource(metrics: DashboardMetric[]) {
  return metrics
    .map(
      (metric) => `          <article style={{ padding: 20, borderRadius: 22, border: '1px solid #DCE6F2', backgroundColor: '#FFFFFF' }}>
            <p style={{ margin: 0, fontSize: 12, color: '#70839C', textTransform: 'uppercase', letterSpacing: '0.05em' }}>${metric.label}</p>
            <h2 style={{ margin: '10px 0 8px 0', fontSize: 32, fontWeight: 700, color: '#172033', letterSpacing: '-0.04em' }}>${metric.value}</h2>
            <p style={{ margin: 0, fontSize: 13, lineHeight: 1.6, color: '#50627D' }}>${metric.note}</p>
          </article>`,
    )
    .join('\n')
}

function buildPriorityItemsSource(items: string[]) {
  return items
    .map(
      (item) =>
        `              <li style={{ margin: 0, fontSize: 14, lineHeight: 1.65, color: '#32445F' }}>${item}</li>`,
    )
    .join('\n')
}

function buildDashboardTemplateSource(config: DashboardVariantConfig, themeName: string) {
  return `export function ${config.name.replace(/(^|_)([a-z])/g, (_match, _a, letter: string) => letter.toUpperCase())}() {
  const salesChannelDataQuery = {
    query: \`
      SELECT
        COALESCE(cv.id::text, COALESCE(cv.nome, '-')) AS key,
        COALESCE(cv.nome, '-') AS label,
        COALESCE(SUM(pi.subtotal), 0)::float AS value
      FROM vendas.pedidos p
      JOIN vendas.pedidos_itens pi ON pi.pedido_id = p.id
      LEFT JOIN vendas.canais_venda cv ON cv.id = p.canal_venda_id
      WHERE 1=1
        {{filters:p}}
      GROUP BY 1, 2
      ORDER BY 3 DESC
    \`,
    xField: 'label',
    yField: 'value',
    keyField: 'key',
    dimension: 'canal_venda',
    limit: 6,
  }

  const salesTrendDataQuery = {
    query: \`
      SELECT
        TO_CHAR(p.data_pedido::date, 'YYYY-MM-DD') AS key,
        TO_CHAR(p.data_pedido::date, 'DD/MM') AS label,
        COALESCE(SUM(p.valor_total), 0)::float AS value
      FROM vendas.pedidos p
      WHERE 1=1
        {{filters:p}}
      GROUP BY 1, 2
      ORDER BY 1 ASC
    \`,
    xField: 'label',
    yField: 'value',
    keyField: 'key',
    limit: 31,
  }

  const totalRevenueKpiDataQuery = {
    query: \`
      SELECT
        COALESCE(SUM(p.valor_total), 0)::float AS value
      FROM vendas.pedidos p
      WHERE 1=1
        {{filters:p}}
    \`,
    limit: 1,
  }

  const totalOrdersKpiDataQuery = {
    query: \`
      SELECT
        COUNT(*)::float AS value
      FROM vendas.pedidos p
      WHERE 1=1
        {{filters:p}}
    \`,
    limit: 1,
  }

  const avgTicketKpiDataQuery = {
    query: \`
      SELECT
        COALESCE(AVG(p.valor_total), 0)::float AS value
      FROM vendas.pedidos p
      WHERE 1=1
        {{filters:p}}
    \`,
    limit: 1,
  }

  const channelSlicerQuery = \`
    SELECT
      cv.id::text AS value,
      COALESCE(cv.nome, '-') AS label
    FROM vendas.canais_venda cv
    ORDER BY 2 ASC
  \`

  const ordersTableDataQuery = {
    query: \`
      SELECT
        p.id::text AS pedido_id,
        TO_CHAR(p.data_pedido::date, 'DD/MM/YYYY') AS data_pedido,
        COALESCE(cv.nome, '-') AS canal,
        COALESCE(p.status, 'Sem status') AS status,
        COALESCE(p.valor_total, 0)::float AS valor_total
      FROM vendas.pedidos p
      LEFT JOIN vendas.canais_venda cv ON cv.id = p.canal_venda_id
      WHERE 1=1
        {{filters:p}}
      ORDER BY p.data_pedido DESC NULLS LAST, p.id DESC
    \`,
    limit: 12,
  }

  const ordersTableColumns = [
    { accessorKey: 'pedido_id', header: 'Pedido' },
    { accessorKey: 'data_pedido', header: 'Data' },
    { accessorKey: 'canal', header: 'Canal' },
    { accessorKey: 'status', header: 'Status', cell: 'badge', meta: { variantMap: { aprovado: 'success', pendente: 'warning', cancelado: 'danger' } } },
    { accessorKey: 'valor_total', header: 'Receita', format: 'currency', align: 'right', headerAlign: 'right' },
  ]

  const salesPivotDataQuery = {
    query: \`
      SELECT
        COALESCE(cv.nome, '-') AS canal,
        COALESCE(p.status, 'Sem status') AS status,
        COALESCE(p.valor_total, 0)::float AS valor_total
      FROM vendas.pedidos p
      LEFT JOIN vendas.canais_venda cv ON cv.id = p.canal_venda_id
      WHERE 1=1
        {{filters:p}}
    \`,
    limit: 400,
  }

  return (
    <DashboardTemplate name="${config.name}" title="${config.title}">
      <Theme name="${themeName}" />
      <Dashboard id="overview" title="${config.title}">
        <section style={{ display: 'flex', flexDirection: 'column', gap: 24, minHeight: '100%', padding: 32, backgroundColor: '#F6F8FC' }}>
          <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 24 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: '62%' }}>
              <span style={{ display: 'inline-flex', width: 'fit-content', alignItems: 'center', borderRadius: 999, backgroundColor: '#E3EEFF', padding: '6px 12px', fontSize: 12, fontWeight: 600, color: '#1E4FBF' }}>${config.badge}</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <p style={{ margin: 0, fontSize: 12, color: '#6A7E98', letterSpacing: '0.08em', textTransform: 'uppercase' }}>${config.eyebrow}</p>
                <h1 style={{ margin: 0, fontSize: 42, fontWeight: 700, color: '#172033', letterSpacing: '-0.04em', lineHeight: 1.02 }}>${config.title}</h1>
              </div>
              <p style={{ margin: 0, fontSize: 15, lineHeight: 1.7, color: '#536783' }}>${config.subtitle}</p>
            </div>
            <article style={{ width: '28%', padding: 22, borderRadius: 24, backgroundColor: '#FFFFFF', border: '1px solid #DCE6F2' }}>
              <p style={{ margin: 0, marginBottom: 10, fontSize: 11, color: '#70839C', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Workspace note</p>
              <p style={{ margin: 0, fontSize: 14, lineHeight: 1.7, color: '#31415E' }}>${config.summary}</p>
            </article>
          </header>

          <section style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
${buildMetricCardsSource(config.metrics)}
          </section>

          <section style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            <article style={{ padding: 22, borderRadius: 22, border: '1px solid #DCE6F2', backgroundColor: '#FFFFFF', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <p style={{ margin: 0, fontSize: 12, color: '#70839C', textTransform: 'uppercase', letterSpacing: '0.05em' }}>KPI query-driven</p>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: '#172033' }}>Receita total</h2>
              <KPI dataQuery={totalRevenueKpiDataQuery} format="currency" />
            </article>
            <article style={{ padding: 22, borderRadius: 22, border: '1px solid #DCE6F2', backgroundColor: '#FFFFFF', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <p style={{ margin: 0, fontSize: 12, color: '#70839C', textTransform: 'uppercase', letterSpacing: '0.05em' }}>KPI query-driven</p>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: '#172033' }}>Pedidos no periodo</h2>
              <KPI dataQuery={totalOrdersKpiDataQuery} format="number" />
            </article>
            <article style={{ padding: 22, borderRadius: 22, border: '1px solid #DCE6F2', backgroundColor: '#FFFFFF', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <p style={{ margin: 0, fontSize: 12, color: '#70839C', textTransform: 'uppercase', letterSpacing: '0.05em' }}>KPI query-driven</p>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: '#172033' }}>Ticket medio</h2>
              <KPI dataQuery={avgTicketKpiDataQuery} format="currency" />
            </article>
          </section>

          <section style={{ display: 'grid', gridTemplateColumns: '1.35fr 0.65fr', gap: 18 }}>
            <article style={{ padding: 22, borderRadius: 26, backgroundColor: '#FFFFFF', border: '1px solid #DCE6F2', display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <p style={{ margin: 0, fontSize: 11, color: '#70839C', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Global controls</p>
                <h2 style={{ margin: 0, fontSize: 24, fontWeight: 600, color: '#172033', letterSpacing: '-0.03em' }}>Filtros conectados ao runtime antigo</h2>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', gap: 14 }}>
                <DatePicker label="Periodo do pedido" table="vendas.pedidos" field="data_pedido" presets={['7d', '30d', 'month']} />
                <Slicer
                  label="Canal de venda"
                  field="canal_venda_id"
                  variant="dropdown"
                  selectionMode="multiple"
                  search
                  clearable
                  width={280}
                  query={channelSlicerQuery}
                />
              </div>
            </article>

            <article style={{ padding: 22, borderRadius: 26, backgroundColor: '#EAF1FF', border: '1px solid #D7E3FA', display: 'flex', flexDirection: 'column', gap: 12 }}>
              <p style={{ margin: 0, fontSize: 11, color: '#5E75A1', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Why this matters</p>
              <p style={{ margin: 0, fontSize: 14, lineHeight: 1.75, color: '#425572' }}>
                The JSX template now keeps the semantic structure, while filters continue to feed the BI runtime. Charts, tables and pivots read the same global filter state without bringing back the old string parser.
              </p>
            </article>
          </section>

          <section style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 18 }}>
            <article style={{ padding: 22, borderRadius: 26, backgroundColor: '#FFFFFF', border: '1px solid #DCE6F2', display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <p style={{ margin: 0, fontSize: 11, color: '#70839C', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Query-driven chart</p>
                <h2 style={{ margin: 0, fontSize: 24, fontWeight: 600, color: '#172033', letterSpacing: '-0.03em' }}>Receita por canal</h2>
              </div>
              <p style={{ margin: 0, fontSize: 14, lineHeight: 1.75, color: '#425572' }}>
                This first widget is still driven by query, filters and click interaction. The template is JSX, but the chart behavior remains connected to the BI data runtime.
              </p>
              <BarChart
                height={280}
                format="currency"
                colorScheme={['#2563EB', '#60A5FA', '#93C5FD', '#BFDBFE']}
                dataQuery={salesChannelDataQuery}
                interaction={{ table: 'vendas.pedidos', field: 'canal_venda_id', clearOnSecondClick: true }}
                recharts={{ categoryLabelMode: 'first-word', valueAxisWidth: 72 }}
              />
            </article>

            <article style={{ padding: 22, borderRadius: 26, backgroundColor: '#EAF1FF', border: '1px solid #D7E3FA', display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <p style={{ margin: 0, fontSize: 11, color: '#5E75A1', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Distribution</p>
                <h2 style={{ margin: 0, fontSize: 24, fontWeight: 600, color: '#172033', letterSpacing: '-0.03em' }}>Participacao por canal</h2>
              </div>
              <p style={{ margin: 0, fontSize: 14, lineHeight: 1.75, color: '#425572' }}>
                The pie view keeps the same query and filter model, but presents relative share for a quicker read during executive review.
              </p>
              <PieChart
                height={280}
                format="currency"
                colorScheme={['#2563EB', '#0F766E', '#EA580C', '#7C3AED', '#DC2626']}
                dataQuery={salesChannelDataQuery}
                interaction={{ table: 'vendas.pedidos', field: 'canal_venda_id', clearOnSecondClick: true }}
                recharts={{ innerRadius: 52, outerRadius: 92, paddingAngle: 2, showLabels: false, legendPosition: 'right' }}
              />
            </article>
          </section>

          <section style={{ display: 'grid', gridTemplateColumns: '1.15fr 0.85fr', gap: 18, flex: 1 }}>
            <article style={{ padding: 22, borderRadius: 26, backgroundColor: '#FFFFFF', border: '1px solid #DCE6F2', display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <p style={{ margin: 0, fontSize: 11, color: '#70839C', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Trend</p>
                <h2 style={{ margin: 0, fontSize: 24, fontWeight: 600, color: '#172033', letterSpacing: '-0.03em' }}>Receita diaria</h2>
              </div>
              <p style={{ margin: 0, fontSize: 14, lineHeight: 1.75, color: '#425572' }}>
                This line chart reacts to the same date picker and slicers, so the preview keeps the same operational behavior as the old dashboard runtime.
              </p>
              <LineChart
                height={280}
                format="currency"
                colorScheme={['#2563EB', '#60A5FA', '#93C5FD']}
                dataQuery={salesTrendDataQuery}
                recharts={{ showDots: false, singleSeriesGradient: true, valueAxisWidth: 72 }}
              />
            </article>

            <article style={{ padding: 22, borderRadius: 26, backgroundColor: '#EAF1FF', border: '1px solid #D7E3FA', display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <p style={{ margin: 0, fontSize: 11, color: '#5E75A1', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Priorities</p>
                <h2 style={{ margin: 0, fontSize: 24, fontWeight: 600, color: '#172033', letterSpacing: '-0.03em' }}>What this view should clarify</h2>
              </div>
              <ul style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 10 }}>
${buildPriorityItemsSource(config.priorities)}
              </ul>
            </article>
          </section>

          <section style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 18 }}>
            <article style={{ padding: 22, borderRadius: 26, backgroundColor: '#FFFFFF', border: '1px solid #DCE6F2', display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <p style={{ margin: 0, fontSize: 11, color: '#70839C', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Table</p>
                <h2 style={{ margin: 0, fontSize: 24, fontWeight: 600, color: '#172033', letterSpacing: '-0.03em' }}>Pedidos filtrados em detalhe</h2>
              </div>
              <p style={{ margin: 0, fontSize: 14, lineHeight: 1.75, color: '#425572' }}>
                The table below consumes the same slicers and date markers as the charts, so the JSX dashboard keeps one shared filter model.
              </p>
              <Table
                height={360}
                bordered
                rounded
                stickyHeader
                dataQuery={ordersTableDataQuery}
                columns={ordersTableColumns}
                enableExportCsv
              />
            </article>

            <article style={{ padding: 22, borderRadius: 26, backgroundColor: '#EAF1FF', border: '1px solid #D7E3FA', display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <p style={{ margin: 0, fontSize: 11, color: '#5E75A1', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Pivot</p>
                <h2 style={{ margin: 0, fontSize: 24, fontWeight: 600, color: '#172033', letterSpacing: '-0.03em' }}>Receita por canal e status</h2>
              </div>
              <p style={{ margin: 0, fontSize: 14, lineHeight: 1.75, color: '#425572' }}>
                PivotTable stays query-driven too, but now it sits directly inside the JSX template instead of depending on the old DSL string pipeline.
              </p>
              <PivotTable
                height={360}
                bordered
                rounded
                stickyHeader
                enableExportCsv
                defaultExpandedLevels={1}
                dataQuery={salesPivotDataQuery}
                rows={[{ field: 'canal', label: 'Canal' }]}
                columns={[{ field: 'status', label: 'Status' }]}
                values={[{ field: 'valor_total', label: 'Receita', aggregate: 'sum', format: 'currency' }]}
              />
            </article>
          </section>

          <footer style={{ display: 'flex', justifyContent: 'space-between', gap: 18, padding: '18px 22px', borderRadius: 22, backgroundColor: '#FFFFFF', border: '1px solid #DCE6F2' }}>
            <p style={{ margin: 0, fontSize: 13, color: '#52647F', lineHeight: 1.6 }}>${config.footer}</p>
            <p style={{ margin: 0, fontSize: 13, color: '#52647F', lineHeight: 1.6 }}>Theme ativo: ${themeName}</p>
          </footer>
        </section>
      </Dashboard>
    </DashboardTemplate>
  )
}`
}

function buildDashboardTemplate(config: DashboardVariantConfig, themeName: string) {
  return (
    <DashboardTemplateMarker name={config.name} title={config.title}>
      <ThemeMarker name={themeName} />
      <DashboardMarker id="overview" title={config.title}>
        <section style={{ display: 'flex', flexDirection: 'column', gap: 24, minHeight: '100%', padding: 32, backgroundColor: '#F6F8FC' }}>
          <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 24 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: '62%' }}>
              <span style={{ display: 'inline-flex', width: 'fit-content', alignItems: 'center', borderRadius: 999, backgroundColor: '#E3EEFF', padding: '6px 12px', fontSize: 12, fontWeight: 600, color: '#1E4FBF' }}>
                {config.badge}
              </span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <p style={{ margin: 0, fontSize: 12, color: '#6A7E98', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{config.eyebrow}</p>
                <h1 style={{ margin: 0, fontSize: 42, fontWeight: 700, color: '#172033', letterSpacing: '-0.04em', lineHeight: 1.02 }}>{config.title}</h1>
              </div>
              <p style={{ margin: 0, fontSize: 15, lineHeight: 1.7, color: '#536783' }}>{config.subtitle}</p>
            </div>
            <article style={{ width: '28%', padding: 22, borderRadius: 24, backgroundColor: '#FFFFFF', border: '1px solid #DCE6F2' }}>
              <p style={{ margin: 0, marginBottom: 10, fontSize: 11, color: '#70839C', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Workspace note</p>
              <p style={{ margin: 0, fontSize: 14, lineHeight: 1.7, color: '#31415E' }}>{config.summary}</p>
            </article>
          </header>

          <section style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            {config.metrics.map((metric) => (
              <article key={metric.label} style={{ padding: 20, borderRadius: 22, border: '1px solid #DCE6F2', backgroundColor: '#FFFFFF' }}>
                <p style={{ margin: 0, fontSize: 12, color: '#70839C', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{metric.label}</p>
                <h2 style={{ margin: '10px 0 8px 0', fontSize: 32, fontWeight: 700, color: '#172033', letterSpacing: '-0.04em' }}>{metric.value}</h2>
                <p style={{ margin: 0, fontSize: 13, lineHeight: 1.6, color: '#50627D' }}>{metric.note}</p>
              </article>
            ))}
          </section>

          <section style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            <article style={{ padding: 22, borderRadius: 22, border: '1px solid #DCE6F2', backgroundColor: '#FFFFFF', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <p style={{ margin: 0, fontSize: 12, color: '#70839C', textTransform: 'uppercase', letterSpacing: '0.05em' }}>KPI query-driven</p>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: '#172033' }}>Receita total</h2>
              <KpiMarker dataQuery={TOTAL_REVENUE_KPI_DATA_QUERY} format="currency" />
            </article>
            <article style={{ padding: 22, borderRadius: 22, border: '1px solid #DCE6F2', backgroundColor: '#FFFFFF', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <p style={{ margin: 0, fontSize: 12, color: '#70839C', textTransform: 'uppercase', letterSpacing: '0.05em' }}>KPI query-driven</p>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: '#172033' }}>Pedidos no periodo</h2>
              <KpiMarker dataQuery={TOTAL_ORDERS_KPI_DATA_QUERY} format="number" />
            </article>
            <article style={{ padding: 22, borderRadius: 22, border: '1px solid #DCE6F2', backgroundColor: '#FFFFFF', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <p style={{ margin: 0, fontSize: 12, color: '#70839C', textTransform: 'uppercase', letterSpacing: '0.05em' }}>KPI query-driven</p>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: '#172033' }}>Ticket medio</h2>
              <KpiMarker dataQuery={AVG_TICKET_KPI_DATA_QUERY} format="currency" />
            </article>
          </section>

          <section style={{ display: 'grid', gridTemplateColumns: '1.35fr 0.65fr', gap: 18 }}>
            <article style={{ padding: 22, borderRadius: 26, backgroundColor: '#FFFFFF', border: '1px solid #DCE6F2', display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <p style={{ margin: 0, fontSize: 11, color: '#70839C', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Global controls</p>
                <h2 style={{ margin: 0, fontSize: 24, fontWeight: 600, color: '#172033', letterSpacing: '-0.03em' }}>Filtros conectados ao runtime antigo</h2>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', gap: 14 }}>
                <DatePickerMarker label="Periodo do pedido" table="vendas.pedidos" field="data_pedido" presets={['7d', '30d', 'month']} />
                <SlicerMarker
                  label="Canal de venda"
                  field="canal_venda_id"
                  variant="dropdown"
                  selectionMode="multiple"
                  search
                  clearable
                  width={280}
                  query={CHANNEL_SLICER_QUERY}
                />
              </div>
            </article>

            <article style={{ padding: 22, borderRadius: 26, backgroundColor: '#EAF1FF', border: '1px solid #D7E3FA', display: 'flex', flexDirection: 'column', gap: 12 }}>
              <p style={{ margin: 0, fontSize: 11, color: '#5E75A1', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Why this matters</p>
              <p style={{ margin: 0, fontSize: 14, lineHeight: 1.75, color: '#425572' }}>
                The JSX template now keeps the semantic structure, while filters continue to feed the BI runtime. Charts, tables and pivots read the same global filter state without bringing back the old string parser.
              </p>
            </article>
          </section>

          <section style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 18 }}>
            <article style={{ padding: 22, borderRadius: 26, backgroundColor: '#FFFFFF', border: '1px solid #DCE6F2', display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <p style={{ margin: 0, fontSize: 11, color: '#70839C', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Query-driven chart</p>
                <h2 style={{ margin: 0, fontSize: 24, fontWeight: 600, color: '#172033', letterSpacing: '-0.03em' }}>Receita por canal</h2>
              </div>
              <p style={{ margin: 0, fontSize: 14, lineHeight: 1.75, color: '#425572' }}>
                This first widget is still driven by query, filters and click interaction. The template is JSX, but the chart behavior remains connected to the BI data runtime.
              </p>
              <BarChartMarker
                height={280}
                format="currency"
                colorScheme={['#2563EB', '#60A5FA', '#93C5FD', '#BFDBFE']}
                dataQuery={SALES_CHANNEL_DATA_QUERY}
                interaction={SALES_CHANNEL_INTERACTION}
                recharts={{ categoryLabelMode: 'first-word', valueAxisWidth: 72 }}
              />
            </article>

            <article style={{ padding: 22, borderRadius: 26, backgroundColor: '#EAF1FF', border: '1px solid #D7E3FA', display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <p style={{ margin: 0, fontSize: 11, color: '#5E75A1', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Distribution</p>
                <h2 style={{ margin: 0, fontSize: 24, fontWeight: 600, color: '#172033', letterSpacing: '-0.03em' }}>Participacao por canal</h2>
              </div>
              <p style={{ margin: 0, fontSize: 14, lineHeight: 1.75, color: '#425572' }}>
                The pie view keeps the same query and filter model, but presents relative share for a quicker read during executive review.
              </p>
              <PieChartMarker
                height={280}
                format="currency"
                colorScheme={['#2563EB', '#0F766E', '#EA580C', '#7C3AED', '#DC2626']}
                dataQuery={SALES_CHANNEL_DATA_QUERY}
                interaction={SALES_CHANNEL_INTERACTION}
                recharts={{ innerRadius: 52, outerRadius: 92, paddingAngle: 2, showLabels: false, legendPosition: 'right' }}
              />
            </article>
          </section>

          <section style={{ display: 'grid', gridTemplateColumns: '1.15fr 0.85fr', gap: 18, flex: 1 }}>
            <article style={{ padding: 22, borderRadius: 26, backgroundColor: '#FFFFFF', border: '1px solid #DCE6F2', display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <p style={{ margin: 0, fontSize: 11, color: '#70839C', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Trend</p>
                <h2 style={{ margin: 0, fontSize: 24, fontWeight: 600, color: '#172033', letterSpacing: '-0.03em' }}>Receita diaria</h2>
              </div>
              <p style={{ margin: 0, fontSize: 14, lineHeight: 1.75, color: '#425572' }}>
                This line chart reacts to the same date picker and slicers, so the preview keeps the same operational behavior as the old dashboard runtime.
              </p>
              <LineChartMarker
                height={280}
                format="currency"
                colorScheme={['#2563EB', '#60A5FA', '#93C5FD']}
                dataQuery={SALES_TREND_DATA_QUERY}
                recharts={{ showDots: false, singleSeriesGradient: true, valueAxisWidth: 72 }}
              />
            </article>

            <article style={{ padding: 22, borderRadius: 26, backgroundColor: '#EAF1FF', border: '1px solid #D7E3FA', display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <p style={{ margin: 0, fontSize: 11, color: '#5E75A1', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Priorities</p>
                <h2 style={{ margin: 0, fontSize: 24, fontWeight: 600, color: '#172033', letterSpacing: '-0.03em' }}>What this view should clarify</h2>
              </div>
              <ul style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {config.priorities.map((item) => (
                  <li key={item} style={{ margin: 0, fontSize: 14, lineHeight: 1.65, color: '#32445F' }}>
                    {item}
                  </li>
                ))}
              </ul>
            </article>
          </section>

          <section style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 18 }}>
            <article style={{ padding: 22, borderRadius: 26, backgroundColor: '#FFFFFF', border: '1px solid #DCE6F2', display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <p style={{ margin: 0, fontSize: 11, color: '#70839C', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Table</p>
                <h2 style={{ margin: 0, fontSize: 24, fontWeight: 600, color: '#172033', letterSpacing: '-0.03em' }}>Pedidos filtrados em detalhe</h2>
              </div>
              <p style={{ margin: 0, fontSize: 14, lineHeight: 1.75, color: '#425572' }}>
                The table below consumes the same slicers and date markers as the charts, so the JSX dashboard keeps one shared filter model.
              </p>
              <TableMarker
                height={360}
                bordered
                rounded
                stickyHeader
                dataQuery={ORDERS_TABLE_DATA_QUERY}
                columns={ORDERS_TABLE_COLUMNS}
                enableExportCsv
              />
            </article>

            <article style={{ padding: 22, borderRadius: 26, backgroundColor: '#EAF1FF', border: '1px solid #D7E3FA', display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <p style={{ margin: 0, fontSize: 11, color: '#5E75A1', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Pivot</p>
                <h2 style={{ margin: 0, fontSize: 24, fontWeight: 600, color: '#172033', letterSpacing: '-0.03em' }}>Receita por canal e status</h2>
              </div>
              <p style={{ margin: 0, fontSize: 14, lineHeight: 1.75, color: '#425572' }}>
                PivotTable stays query-driven too, but now it sits directly inside the JSX template instead of depending on the old DSL string pipeline.
              </p>
              <PivotTableMarker
                height={360}
                bordered
                rounded
                stickyHeader
                enableExportCsv
                defaultExpandedLevels={1}
                dataQuery={SALES_PIVOT_DATA_QUERY}
                rows={SALES_PIVOT_ROWS}
                columns={SALES_PIVOT_COLUMNS}
                values={SALES_PIVOT_VALUES}
              />
            </article>
          </section>

          <footer style={{ display: 'flex', justifyContent: 'space-between', gap: 18, padding: '18px 22px', borderRadius: 22, backgroundColor: '#FFFFFF', border: '1px solid #DCE6F2' }}>
            <p style={{ margin: 0, fontSize: 13, color: '#52647F', lineHeight: 1.6 }}>{config.footer}</p>
            <p style={{ margin: 0, fontSize: 13, color: '#52647F', lineHeight: 1.6 }}>Theme ativo: {themeName}</p>
          </footer>
        </section>
      </DashboardMarker>
    </DashboardTemplateMarker>
  )
}

export function buildDashboardTemplateVariants(themeName: string): DashboardTemplateVariant[] {
  return DASHBOARD_VARIANTS.map((variant) => {
    const tree = jsxToTree(buildDashboardTemplate(variant, themeName))
    if (!tree || typeof tree === 'string') {
      throw new Error(`Invalid dashboard template root for ${variant.name}`)
    }

    return {
      content: buildDashboardTemplateSource(variant, themeName),
      name: variant.fileName,
      path: variant.path,
      tree,
    }
  })
}
