'use client'

import React, { isValidElement, ReactNode } from 'react'
import { buildThemeVars } from '@/products/bi/json-render/theme/themeAdapter'

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
  height?: number | string
  interaction?: Record<string, unknown>
  recharts?: Record<string, unknown>
}

type LineChartMarkerProps = BarChartMarkerProps
type PieChartMarkerProps = BarChartMarkerProps
type ChartMarkerProps = BarChartMarkerProps & {
  type: string
}
type WidgetMarkerProps = {
  [key: string]: unknown
}
type TabsMarkerProps = MarkerProps & {
  defaultValue?: string
}
type TabMarkerProps = MarkerProps & {
  as?: string
  value?: string
}
type TabPanelMarkerProps = MarkerProps & {
  as?: string
  forceMount?: boolean
  value?: string
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

type StandaloneDashboardVariant = {
  fileName: string
  name: string
  path: string
  title: string
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

function ChartMarker(_: ChartMarkerProps) {
  return null
}

function Card({ children }: MarkerProps & WidgetMarkerProps) {
  return <>{children}</>
}

function KpiMarker(_: WidgetMarkerProps) {
  return null
}

function QueryMarker({ children }: MarkerProps & WidgetMarkerProps) {
  return <>{children}</>
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

function TabsMarker({ children }: TabsMarkerProps) {
  return <>{children}</>
}

function TabMarker({ children }: TabMarkerProps) {
  return <>{children}</>
}

function TabPanelMarker({ children }: TabPanelMarkerProps) {
  return <>{children}</>
}

DashboardTemplateMarker.displayName = 'DashboardTemplate'
ThemeMarker.displayName = 'Theme'
DashboardMarker.displayName = 'Dashboard'
BarChartMarker.displayName = 'BarChart'
LineChartMarker.displayName = 'LineChart'
PieChartMarker.displayName = 'PieChart'
ChartMarker.displayName = 'Chart'
Card.displayName = 'Card'
KpiMarker.displayName = 'KPI'
QueryMarker.displayName = 'Query'
TableMarker.displayName = 'Table'
PivotTableMarker.displayName = 'PivotTable'
SlicerMarker.displayName = 'Slicer'
DatePickerMarker.displayName = 'DatePicker'
TabsMarker.displayName = 'Tabs'
TabMarker.displayName = 'Tab'
TabPanelMarker.displayName = 'TabPanel'

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

const SALES_CHANNEL_INTERACTION = {
  table: 'vendas.pedidos',
  field: 'canal_venda_id',
  clearOnSecondClick: true,
}

type DashboardThemeUi = {
  cardFrame: { variant: 'hud'; cornerSize: number; cornerWidth: number } | null
  chartScheme: string[]
  page: React.CSSProperties
  header: React.CSSProperties
  badge: React.CSSProperties
  noteCard: React.CSSProperties
  metricCard: React.CSSProperties
  queryCard: React.CSSProperties
  panelCard: React.CSSProperties
  panelCardAlt: React.CSSProperties
  footer: React.CSSProperties
  eyebrow: React.CSSProperties
  title: React.CSSProperties
  subtitle: React.CSSProperties
  paragraph: React.CSSProperties
  metricLabel: React.CSSProperties
  metricValue: React.CSSProperties
  metricNote: React.CSSProperties
  kpiLabel: React.CSSProperties
  kpiValue: React.CSSProperties
  kpiDelta: React.CSSProperties
}

function resolveDashboardCardFrame(themeName: string) {
  const key = String(themeName || '').toLowerCase()
  if (['midnight', 'metro', 'aero'].includes(key)) {
    return { variant: 'hud' as const, cornerSize: 10, cornerWidth: 2 }
  }
  if (['light', 'white', 'claro', 'branco', 'sand'].includes(key)) {
    return { variant: 'hud' as const, cornerSize: 6, cornerWidth: 1 }
  }
  return { variant: 'hud' as const, cornerSize: 8, cornerWidth: 1 }
}

function buildFramePropSource(frame: DashboardThemeUi['cardFrame']): string {
  return frame ? ` frame={${JSON.stringify(frame)}}` : ''
}

function buildDashboardThemeUi(themeName: string, variant: 'default' | 'classic' = 'default'): DashboardThemeUi {
  const preset = buildThemeVars(themeName)
  const cssVars = preset.cssVars || {}
  const managers = (preset.managers || {}) as Record<string, any>
  const chartScheme = Array.isArray(managers?.color?.scheme) && managers.color.scheme.length
    ? (managers.color.scheme as string[])
    : ['#2563EB', '#60A5FA', '#93C5FD', '#BFDBFE', '#0EA5E9']

  const dark = ['dark', 'black', 'slate', 'navy', 'charcoal', 'midnight', 'metro', 'aero'].includes(
    String(themeName || '').toLowerCase(),
  )
  const primary = chartScheme[0] || '#2563EB'
  const pageBg = String(cssVars.bg || (dark ? '#0F172A' : '#F6F8FC'))
  const surfaceBg = String(cssVars.surfaceBg || (dark ? '#111827' : '#FFFFFF'))
  const borderColor = String(cssVars.surfaceBorder || (dark ? '#334155' : '#DCE6F2'))
  const textPrimary = String(cssVars.fg || cssVars.h1Color || (dark ? '#E5E7EB' : '#172033'))
  const textSecondary = String(cssVars.headerSubtitle || cssVars.kpiTitleColor || (dark ? '#94A3B8' : '#536783'))
  const titleColor = String(cssVars.h1Color || textPrimary)
  const headerBg = String(cssVars.headerBg || surfaceBg)
  const headerText = String(cssVars.headerText || titleColor)
  const headerSubtitle = String(cssVars.headerSubtitle || textSecondary)
  const accentSurface = `color-mix(in srgb, ${surfaceBg} 84%, ${primary} 16%)`
  const accentBorder = `color-mix(in srgb, ${borderColor} 60%, ${primary} 40%)`
  const accentText = dark ? '#FFFFFF' : primary
  const isClassic = variant === 'classic'
  const cardFrame = isClassic ? resolveDashboardCardFrame(themeName) : null

  return {
    cardFrame,
    chartScheme,
    page: {
      display: 'flex',
      flexDirection: 'column',
      gap: isClassic ? 20 : 24,
      minHeight: '100%',
      padding: isClassic ? 28 : 32,
      backgroundColor: pageBg,
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      gap: isClassic ? 20 : 24,
      padding: isClassic ? '20px 24px' : 24,
      borderRadius: 24,
      border: `1px solid ${borderColor}`,
      backgroundColor: headerBg,
      color: headerText,
    },
    badge: {
      display: 'inline-flex',
      width: 'fit-content',
      alignItems: 'center',
      borderRadius: 999,
      border: `1px solid ${accentBorder}`,
      backgroundColor: accentSurface,
      padding: '6px 12px',
      fontSize: 12,
      fontWeight: 600,
      color: accentText,
    },
    noteCard: {
      width: '28%',
      padding: 22,
      borderRadius: isClassic && cardFrame ? 0 : 24,
      backgroundColor: accentSurface,
      border: `1px solid ${accentBorder}`,
    },
    metricCard: {
      padding: 20,
      borderRadius: isClassic && cardFrame ? 0 : 22,
      border: `1px solid ${borderColor}`,
      backgroundColor: surfaceBg,
    },
    queryCard: {
      padding: isClassic ? 18 : 22,
      borderRadius: isClassic && cardFrame ? 0 : isClassic ? 20 : 22,
      border: `1px solid ${borderColor}`,
      backgroundColor: surfaceBg,
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
    },
    panelCard: {
      padding: 22,
      borderRadius: isClassic && cardFrame ? 0 : isClassic ? 24 : 26,
      backgroundColor: surfaceBg,
      border: `1px solid ${borderColor}`,
      display: 'flex',
      flexDirection: 'column',
      gap: 14,
    },
    panelCardAlt: {
      padding: 22,
      borderRadius: isClassic && cardFrame ? 0 : isClassic ? 24 : 26,
      backgroundColor: isClassic ? surfaceBg : accentSurface,
      border: `1px solid ${isClassic ? borderColor : accentBorder}`,
      display: 'flex',
      flexDirection: 'column',
      gap: 14,
    },
    footer: {
      display: 'flex',
      justifyContent: 'space-between',
      gap: 18,
      padding: '18px 22px',
      borderRadius: 22,
      backgroundColor: surfaceBg,
      border: `1px solid ${borderColor}`,
    },
    eyebrow: {
      margin: 0,
      fontSize: 11,
      color: headerSubtitle,
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
    },
    title: {
      margin: 0,
      fontSize: 24,
      fontWeight: 600,
      color: titleColor,
      letterSpacing: '-0.03em',
    },
    subtitle: {
      margin: 0,
      fontSize: 15,
      lineHeight: 1.7,
      color: textSecondary,
    },
    paragraph: {
      margin: 0,
      fontSize: 14,
      lineHeight: 1.75,
      color: textSecondary,
    },
    metricLabel: {
      margin: 0,
      fontSize: 12,
      color: textSecondary,
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
    },
    metricValue: {
      margin: '10px 0 8px 0',
      fontSize: 32,
      fontWeight: 700,
      color: titleColor,
      letterSpacing: '-0.04em',
    },
    metricNote: {
      margin: 0,
      fontSize: 13,
      lineHeight: 1.6,
      color: textSecondary,
    },
    kpiLabel: {
      margin: 0,
      fontSize: 12,
      color: textSecondary,
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
    },
    kpiValue: {
      margin: 0,
      fontSize: 30,
      fontWeight: 700,
      letterSpacing: '-0.04em',
      color: String(cssVars.kpiValueColor || titleColor),
    },
    kpiDelta: {
      margin: 0,
      fontSize: 13,
      color: textSecondary,
    },
  }
}

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

function buildMetricCardsSource(metrics: DashboardMetric[], ui: DashboardThemeUi) {
  return metrics
    .map(
      (metric) => `          <article style={${JSON.stringify(ui.metricCard)}}>
            <p style={${JSON.stringify(ui.metricLabel)}}>${metric.label}</p>
            <h2 style={${JSON.stringify(ui.metricValue)}}>${metric.value}</h2>
            <p style={${JSON.stringify(ui.metricNote)}}>${metric.note}</p>
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
  const ui = buildDashboardThemeUi(themeName)
  return `export function ${config.name.replace(/(^|_)([a-z])/g, (_match, _a, letter: string) => letter.toUpperCase())}() {
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
            <article style={${JSON.stringify(ui.noteCard)}}>
              <p data-ui="eyebrow" style={{ margin: 0, marginBottom: 10, fontSize: 11, color: '#70839C', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Workspace note</p>
              <p style={{ margin: 0, fontSize: 14, lineHeight: 1.7, color: '#31415E' }}>${config.summary}</p>
            </article>
          </header>

          <section style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
${buildMetricCardsSource(config.metrics, ui)}
          </section>

          <section style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            <Query
              dataQuery={{
                query: \`
                  SELECT
                    COALESCE(SUM(p.valor_total), 0)::float AS value
                  FROM vendas.pedidos p
                  WHERE 1=1
                    {{filters:p}}
                \`,
                limit: 1,
              }}
              format="currency"
              comparisonMode="previous_period"
            >
              <article data-ui="card" style={${JSON.stringify(ui.queryCard)}}>
                <p data-ui="eyebrow" style={{ margin: 0, fontSize: 12, color: '#70839C', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Query-driven metric</p>
                <h2 data-ui="kpi-title" style={{ margin: 0, fontSize: 18, fontWeight: 600, color: '#172033' }}>Receita total</h2>
                <p data-ui="kpi-value" style={{ margin: 0, fontSize: 30, fontWeight: 700, letterSpacing: '-0.04em', color: '#172033' }}>{'{{query.valueFormatted}}'}</p>
                <p data-ui="kpi-delta" style={{ margin: 0, fontSize: 13, color: '#52647F' }}>{'{{query.deltaPercentDisplay}} {{query.comparisonLabel}}'}</p>
              </article>
            </Query>
            <Query
              dataQuery={{
                query: \`
                  SELECT
                    COUNT(*)::float AS value
                  FROM vendas.pedidos p
                  WHERE 1=1
                    {{filters:p}}
                \`,
                limit: 1,
              }}
              format="number"
              comparisonMode="previous_period"
            >
              <article data-ui="card" style={${JSON.stringify(ui.queryCard)}}>
                <p data-ui="eyebrow" style={{ margin: 0, fontSize: 12, color: '#70839C', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Query-driven metric</p>
                <h2 data-ui="kpi-title" style={{ margin: 0, fontSize: 18, fontWeight: 600, color: '#172033' }}>Pedidos no periodo</h2>
                <p data-ui="kpi-value" style={{ margin: 0, fontSize: 30, fontWeight: 700, letterSpacing: '-0.04em', color: '#172033' }}>{'{{query.valueFormatted}}'}</p>
                <p data-ui="kpi-delta" style={{ margin: 0, fontSize: 13, color: '#52647F' }}>{'{{query.deltaPercentDisplay}} {{query.comparisonLabel}}'}</p>
              </article>
            </Query>
            <Query
              dataQuery={{
                query: \`
                  SELECT
                    COALESCE(AVG(p.valor_total), 0)::float AS value
                  FROM vendas.pedidos p
                  WHERE 1=1
                    {{filters:p}}
                \`,
                limit: 1,
              }}
              format="currency"
              comparisonMode="previous_period"
            >
              <article data-ui="card" style={${JSON.stringify(ui.queryCard)}}>
                <p data-ui="eyebrow" style={{ margin: 0, fontSize: 12, color: '#70839C', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Query-driven metric</p>
                <h2 data-ui="kpi-title" style={{ margin: 0, fontSize: 18, fontWeight: 600, color: '#172033' }}>Ticket medio</h2>
                <p data-ui="kpi-value" style={{ margin: 0, fontSize: 30, fontWeight: 700, letterSpacing: '-0.04em', color: '#172033' }}>{'{{query.valueFormatted}}'}</p>
                <p data-ui="kpi-delta" style={{ margin: 0, fontSize: 13, color: '#52647F' }}>{'{{query.deltaPercentDisplay}} {{query.comparisonLabel}}'}</p>
              </article>
            </Query>
          </section>

          <section style={{ display: 'grid', gridTemplateColumns: '1.35fr 0.65fr', gap: 18 }}>
            <article data-ui="card" style={{ ...${JSON.stringify(ui.panelCard)}, gap: 16 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <p data-ui="eyebrow" style={{ margin: 0, fontSize: 11, color: '#70839C', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Global controls</p>
                <h2 data-ui="title" style={{ margin: 0, fontSize: 24, fontWeight: 600, color: '#172033', letterSpacing: '-0.03em' }}>Filtros conectados ao runtime antigo</h2>
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
                  query={\`
                    SELECT
                      cv.id::text AS value,
                      COALESCE(cv.nome, '-') AS label
                    FROM vendas.canais_venda cv
                    ORDER BY 2 ASC
                  \`}
                />
              </div>
            </article>

            <article style={{ ...${JSON.stringify(ui.panelCardAlt)}, gap: 12 }}>
              <p style={{ margin: 0, fontSize: 11, color: '#5E75A1', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Why this matters</p>
              <p style={{ margin: 0, fontSize: 14, lineHeight: 1.75, color: '#425572' }}>
                The JSX template now keeps the semantic structure, while filters continue to feed the BI runtime. Charts, tables and pivots read the same global filter state without bringing back the old string parser.
              </p>
            </article>
          </section>

          <Tabs defaultValue="commercial">
            <div data-ui="tabs" style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <Tab value="commercial">Canais</Tab>
              <Tab value="trend">Tendencia</Tab>
              <Tab value="details">Detalhamento</Tab>
            </div>

            <TabPanel value="commercial">
              <section style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 18 }}>
                <article data-ui="card" style={${JSON.stringify(ui.panelCard)}}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <p data-ui="eyebrow" style={{ margin: 0, fontSize: 11, color: '#70839C', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Query-driven chart</p>
                    <h2 data-ui="title" style={{ margin: 0, fontSize: 24, fontWeight: 600, color: '#172033', letterSpacing: '-0.03em' }}>Receita por canal</h2>
                  </div>
                  <p style={{ margin: 0, fontSize: 14, lineHeight: 1.75, color: '#425572' }}>
                    This first widget is still driven by query, filters and click interaction. The template is JSX, but the chart behavior remains connected to the BI data runtime.
                  </p>
                  <Chart
                    type="bar"
                    height={280}
                    format="currency"
                    colorScheme={['#2563EB', '#60A5FA', '#93C5FD', '#BFDBFE']}
                    dataQuery={{
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
                    }}
                    interaction={{ table: 'vendas.pedidos', field: 'canal_venda_id', clearOnSecondClick: true }}
                    recharts={{ categoryLabelMode: 'first-word', valueAxisWidth: 72 }}
                  />
                </article>

                <article data-ui="card" style={${JSON.stringify(ui.panelCardAlt)}}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <p data-ui="eyebrow" style={{ margin: 0, fontSize: 11, color: '#5E75A1', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Distribution</p>
                    <h2 data-ui="title" style={{ margin: 0, fontSize: 24, fontWeight: 600, color: '#172033', letterSpacing: '-0.03em' }}>Participacao por canal</h2>
                  </div>
                  <p style={{ margin: 0, fontSize: 14, lineHeight: 1.75, color: '#425572' }}>
                    The pie view keeps the same query and filter model, but presents relative share for a quicker read during executive review.
                  </p>
                  <Chart
                    type="pie"
                    height={280}
                    format="currency"
                    colorScheme={['#2563EB', '#0F766E', '#EA580C', '#7C3AED', '#DC2626']}
                    dataQuery={{
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
                    }}
                    interaction={{ table: 'vendas.pedidos', field: 'canal_venda_id', clearOnSecondClick: true }}
                    recharts={{ innerRadius: 52, outerRadius: 92, paddingAngle: 2, showLabels: false, legendPosition: 'right' }}
                  />
                </article>
              </section>
            </TabPanel>

            <TabPanel value="trend">
              <section style={{ display: 'grid', gridTemplateColumns: '1.15fr 0.85fr', gap: 18, flex: 1 }}>
                <article data-ui="card" style={${JSON.stringify(ui.panelCard)}}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <p data-ui="eyebrow" style={{ margin: 0, fontSize: 11, color: '#70839C', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Trend</p>
                    <h2 data-ui="title" style={{ margin: 0, fontSize: 24, fontWeight: 600, color: '#172033', letterSpacing: '-0.03em' }}>Receita diaria</h2>
                  </div>
                  <p style={{ margin: 0, fontSize: 14, lineHeight: 1.75, color: '#425572' }}>
                    This line chart reacts to the same date picker and slicers, so the preview keeps the same operational behavior as the old dashboard runtime.
                  </p>
                  <Chart
                    type="line"
                    height={280}
                    format="currency"
                    colorScheme={['#2563EB', '#60A5FA', '#93C5FD']}
                    dataQuery={{
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
                    }}
                    recharts={{ showDots: false, singleSeriesGradient: true, valueAxisWidth: 72 }}
                  />
                </article>

                <article data-ui="card" style={${JSON.stringify(ui.panelCardAlt)}}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <p data-ui="eyebrow" style={{ margin: 0, fontSize: 11, color: '#5E75A1', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Priorities</p>
                    <h2 data-ui="title" style={{ margin: 0, fontSize: 24, fontWeight: 600, color: '#172033', letterSpacing: '-0.03em' }}>What this view should clarify</h2>
                  </div>
                  <ul style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 10 }}>
${buildPriorityItemsSource(config.priorities)}
                  </ul>
                </article>
              </section>
            </TabPanel>

            <TabPanel value="details">
              <section style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 18 }}>
                <article data-ui="table-card" style={${JSON.stringify(ui.panelCard)}}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <p data-ui="eyebrow" style={{ margin: 0, fontSize: 11, color: '#70839C', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Table</p>
                    <h2 data-ui="title" style={{ margin: 0, fontSize: 24, fontWeight: 600, color: '#172033', letterSpacing: '-0.03em' }}>Pedidos filtrados em detalhe</h2>
                  </div>
                  <p style={{ margin: 0, fontSize: 14, lineHeight: 1.75, color: '#425572' }}>
                    The table below consumes the same slicers and date markers as the charts, so the JSX dashboard keeps one shared filter model.
                  </p>
                  <Table
                    bordered
                    rounded
                    stickyHeader
                    dataQuery={{
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
                    }}
                    columns={[
                      { accessorKey: 'pedido_id', header: 'Pedido' },
                      { accessorKey: 'data_pedido', header: 'Data' },
                      { accessorKey: 'canal', header: 'Canal' },
                      { accessorKey: 'status', header: 'Status', cell: 'badge', meta: { variantMap: { aprovado: 'success', pendente: 'warning', cancelado: 'danger' } } },
                      { accessorKey: 'valor_total', header: 'Receita', format: 'currency', align: 'right', headerAlign: 'right' },
                    ]}
                    enableExportCsv
                  />
                </article>

                <article data-ui="pivot-card" style={${JSON.stringify(ui.panelCardAlt)}}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <p data-ui="eyebrow" style={{ margin: 0, fontSize: 11, color: '#5E75A1', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Pivot</p>
                    <h2 data-ui="title" style={{ margin: 0, fontSize: 24, fontWeight: 600, color: '#172033', letterSpacing: '-0.03em' }}>Receita por canal e status</h2>
                  </div>
                  <p style={{ margin: 0, fontSize: 14, lineHeight: 1.75, color: '#425572' }}>
                    PivotTable stays query-driven too, but now it sits directly inside the JSX template instead of depending on the old DSL string pipeline.
                  </p>
                  <PivotTable
                    bordered
                    rounded
                    stickyHeader
                    enableExportCsv
                    defaultExpandedLevels={1}
                    dataQuery={{
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
                    }}
                    rows={[{ field: 'canal', label: 'Canal' }]}
                    columns={[{ field: 'status', label: 'Status' }]}
                    values={[{ field: 'valor_total', label: 'Receita', aggregate: 'sum', format: 'currency' }]}
                  />
                </article>
              </section>
            </TabPanel>
          </Tabs>

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
  const ui = buildDashboardThemeUi(themeName)
  return (
    <DashboardTemplateMarker name={config.name} title={config.title}>
      <ThemeMarker name={themeName} />
      <DashboardMarker id="overview" title={config.title}>
        <section style={ui.page}>
          <header style={ui.header}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: '62%' }}>
              <span style={ui.badge}>
                {config.badge}
              </span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <p style={{ ...ui.metricLabel, letterSpacing: '0.08em' }}>{config.eyebrow}</p>
                <h1 style={{ margin: 0, fontSize: 42, fontWeight: 700, color: ui.title.color, letterSpacing: '-0.04em', lineHeight: 1.02 }}>{config.title}</h1>
              </div>
              <p style={ui.subtitle}>{config.subtitle}</p>
            </div>
            <article style={ui.noteCard}>
              <p data-ui="eyebrow" style={{ ...ui.eyebrow, marginBottom: 10 }}>Workspace note</p>
              <p style={ui.paragraph}>{config.summary}</p>
            </article>
          </header>

          <section style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            {config.metrics.map((metric) => (
              <article key={metric.label} style={ui.metricCard}>
                <p style={ui.metricLabel}>{metric.label}</p>
                <h2 style={ui.metricValue}>{metric.value}</h2>
                <p style={ui.metricNote}>{metric.note}</p>
              </article>
            ))}
          </section>

          <section style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            <QueryMarker
              dataQuery={{
                query: `
                  SELECT
                    COALESCE(SUM(p.valor_total), 0)::float AS value
                  FROM vendas.pedidos p
                  WHERE 1=1
                    {{filters:p}}
                `,
                limit: 1,
              }}
              format="currency"
              comparisonMode="previous_period"
            >
              <article data-ui="card" style={ui.queryCard}>
                <p data-ui="eyebrow" style={ui.kpiLabel}>Query-driven metric</p>
                <h2 data-ui="kpi-title" style={{ margin: 0, fontSize: 18, fontWeight: 600, color: ui.title.color }}>Receita total</h2>
                <p data-ui="kpi-value" style={ui.kpiValue}>{'{{query.valueFormatted}}'}</p>
                <p data-ui="kpi-delta" style={ui.kpiDelta}>{'{{query.deltaPercentDisplay}} {{query.comparisonLabel}}'}</p>
              </article>
            </QueryMarker>
            <QueryMarker
              dataQuery={{
                query: `
                  SELECT
                    COUNT(*)::float AS value
                  FROM vendas.pedidos p
                  WHERE 1=1
                    {{filters:p}}
                `,
                limit: 1,
              }}
              format="number"
              comparisonMode="previous_period"
            >
              <article data-ui="card" style={ui.queryCard}>
                <p data-ui="eyebrow" style={ui.kpiLabel}>Query-driven metric</p>
                <h2 data-ui="kpi-title" style={{ margin: 0, fontSize: 18, fontWeight: 600, color: ui.title.color }}>Pedidos no periodo</h2>
                <p data-ui="kpi-value" style={ui.kpiValue}>{'{{query.valueFormatted}}'}</p>
                <p data-ui="kpi-delta" style={ui.kpiDelta}>{'{{query.deltaPercentDisplay}} {{query.comparisonLabel}}'}</p>
              </article>
            </QueryMarker>
            <QueryMarker
              dataQuery={{
                query: `
                  SELECT
                    COALESCE(AVG(p.valor_total), 0)::float AS value
                  FROM vendas.pedidos p
                  WHERE 1=1
                    {{filters:p}}
                `,
                limit: 1,
              }}
              format="currency"
              comparisonMode="previous_period"
            >
              <article data-ui="card" style={ui.queryCard}>
                <p data-ui="eyebrow" style={ui.kpiLabel}>Query-driven metric</p>
                <h2 data-ui="kpi-title" style={{ margin: 0, fontSize: 18, fontWeight: 600, color: ui.title.color }}>Ticket medio</h2>
                <p data-ui="kpi-value" style={ui.kpiValue}>{'{{query.valueFormatted}}'}</p>
                <p data-ui="kpi-delta" style={ui.kpiDelta}>{'{{query.deltaPercentDisplay}} {{query.comparisonLabel}}'}</p>
              </article>
            </QueryMarker>
          </section>

          <section style={{ display: 'grid', gridTemplateColumns: '1.35fr 0.65fr', gap: 18 }}>
            <article data-ui="card" style={{ ...ui.panelCard, gap: 16 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <p data-ui="eyebrow" style={ui.eyebrow}>Global controls</p>
                <h2 data-ui="title" style={ui.title}>Filtros conectados ao runtime antigo</h2>
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
                  query={`
                    SELECT
                      cv.id::text AS value,
                      COALESCE(cv.nome, '-') AS label
                    FROM vendas.canais_venda cv
                    ORDER BY 2 ASC
                  `}
                />
              </div>
            </article>

            <article style={{ ...ui.panelCardAlt, gap: 12 }}>
              <p style={ui.eyebrow}>Why this matters</p>
              <p style={ui.paragraph}>
                The JSX template now keeps the semantic structure, while filters continue to feed the BI runtime. Charts, tables and pivots read the same global filter state without bringing back the old string parser.
              </p>
            </article>
          </section>

          <TabsMarker defaultValue="commercial">
            <div data-ui="tabs" style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <TabMarker value="commercial">Canais</TabMarker>
              <TabMarker value="trend">Tendencia</TabMarker>
              <TabMarker value="details">Detalhamento</TabMarker>
            </div>

            <TabPanelMarker value="commercial">
              <section style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 18 }}>
                <article data-ui="card" style={ui.panelCard}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <p data-ui="eyebrow" style={ui.eyebrow}>Query-driven chart</p>
                    <h2 data-ui="title" style={ui.title}>Receita por canal</h2>
                  </div>
                  <p style={ui.paragraph}>
                    This first widget is still driven by query, filters and click interaction. The template is JSX, but the chart behavior remains connected to the BI data runtime.
                  </p>
                  <ChartMarker
                    type="bar"
                    height={280}
                    format="currency"
                    colorScheme={ui.chartScheme}
                    dataQuery={{
                      query: `
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
                      `,
                      xField: 'label',
                      yField: 'value',
                      keyField: 'key',
                      dimension: 'canal_venda',
                      limit: 6,
                    }}
                    interaction={SALES_CHANNEL_INTERACTION}
                    recharts={{ categoryLabelMode: 'first-word', valueAxisWidth: 72 }}
                  />
                </article>

                <article data-ui="card" style={ui.panelCardAlt}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <p data-ui="eyebrow" style={ui.eyebrow}>Distribution</p>
                    <h2 data-ui="title" style={ui.title}>Participacao por canal</h2>
                  </div>
                  <p style={ui.paragraph}>
                    The pie view keeps the same query and filter model, but presents relative share for a quicker read during executive review.
                  </p>
                  <ChartMarker
                    type="pie"
                    height={280}
                    format="currency"
                    colorScheme={ui.chartScheme}
                    dataQuery={{
                      query: `
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
                      `,
                      xField: 'label',
                      yField: 'value',
                      keyField: 'key',
                      dimension: 'canal_venda',
                      limit: 6,
                    }}
                    interaction={SALES_CHANNEL_INTERACTION}
                    recharts={{ innerRadius: 52, outerRadius: 92, paddingAngle: 2, showLabels: false, legendPosition: 'right' }}
                  />
                </article>
              </section>
            </TabPanelMarker>

            <TabPanelMarker value="trend">
              <section style={{ display: 'grid', gridTemplateColumns: '1.15fr 0.85fr', gap: 18, flex: 1 }}>
                <article data-ui="card" style={ui.panelCard}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <p data-ui="eyebrow" style={ui.eyebrow}>Trend</p>
                    <h2 data-ui="title" style={ui.title}>Receita diaria</h2>
                  </div>
                  <p style={ui.paragraph}>
                    This line chart reacts to the same date picker and slicers, so the preview keeps the same operational behavior as the old dashboard runtime.
                  </p>
                  <ChartMarker
                    type="line"
                    height={280}
                    format="currency"
                    colorScheme={ui.chartScheme}
                    dataQuery={{
                      query: `
                        SELECT
                          TO_CHAR(p.data_pedido::date, 'YYYY-MM-DD') AS key,
                          TO_CHAR(p.data_pedido::date, 'DD/MM') AS label,
                          COALESCE(SUM(p.valor_total), 0)::float AS value
                        FROM vendas.pedidos p
                        WHERE 1=1
                          {{filters:p}}
                        GROUP BY 1, 2
                        ORDER BY 1 ASC
                      `,
                      xField: 'label',
                      yField: 'value',
                      keyField: 'key',
                      limit: 31,
                    }}
                    recharts={{ showDots: false, singleSeriesGradient: true, valueAxisWidth: 72 }}
                  />
                </article>

                <article data-ui="card" style={ui.panelCardAlt}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <p data-ui="eyebrow" style={ui.eyebrow}>Priorities</p>
                    <h2 data-ui="title" style={ui.title}>What this view should clarify</h2>
                  </div>
                  <ul style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {config.priorities.map((item) => (
                      <li key={item} style={{ margin: 0, fontSize: 14, lineHeight: 1.65, color: ui.paragraph.color }}>
                        {item}
                      </li>
                    ))}
                  </ul>
                </article>
              </section>
            </TabPanelMarker>

            <TabPanelMarker value="details">
              <section style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 18 }}>
                <article data-ui="table-card" style={ui.panelCard}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <p data-ui="eyebrow" style={ui.eyebrow}>Table</p>
                    <h2 data-ui="title" style={ui.title}>Pedidos filtrados em detalhe</h2>
                  </div>
                  <p style={ui.paragraph}>
                    The table below consumes the same slicers and date markers as the charts, so the JSX dashboard keeps one shared filter model.
                  </p>
                  <TableMarker
                    bordered
                    rounded
                    stickyHeader
                    dataQuery={{
                      query: `
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
                      `,
                      limit: 12,
                    }}
                    columns={[
                      { accessorKey: 'pedido_id', header: 'Pedido' },
                      { accessorKey: 'data_pedido', header: 'Data' },
                      { accessorKey: 'canal', header: 'Canal' },
                      { accessorKey: 'status', header: 'Status', cell: 'badge', meta: { variantMap: { aprovado: 'success', pendente: 'warning', cancelado: 'danger' } } },
                      { accessorKey: 'valor_total', header: 'Receita', format: 'currency', align: 'right', headerAlign: 'right' },
                    ]}
                    enableExportCsv
                  />
                </article>

                <article data-ui="pivot-card" style={ui.panelCardAlt}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <p data-ui="eyebrow" style={ui.eyebrow}>Pivot</p>
                    <h2 data-ui="title" style={ui.title}>Receita por canal e status</h2>
                  </div>
                  <p style={ui.paragraph}>
                    PivotTable stays query-driven too, but now it sits directly inside the JSX template instead of depending on the old DSL string pipeline.
                  </p>
                  <PivotTableMarker
                    bordered
                    rounded
                    stickyHeader
                    enableExportCsv
                    defaultExpandedLevels={1}
                    dataQuery={{
                      query: `
                        SELECT
                          COALESCE(cv.nome, '-') AS canal,
                          COALESCE(p.status, 'Sem status') AS status,
                          COALESCE(p.valor_total, 0)::float AS valor_total
                        FROM vendas.pedidos p
                        LEFT JOIN vendas.canais_venda cv ON cv.id = p.canal_venda_id
                        WHERE 1=1
                          {{filters:p}}
                      `,
                      limit: 400,
                    }}
                    rows={[{ field: 'canal', label: 'Canal' }]}
                    columns={[{ field: 'status', label: 'Status' }]}
                    values={[{ field: 'valor_total', label: 'Receita', aggregate: 'sum', format: 'currency' }]}
                  />
                </article>
              </section>
            </TabPanelMarker>
          </TabsMarker>

          <footer style={ui.footer}>
            <p style={{ margin: 0, fontSize: 13, color: ui.paragraph.color, lineHeight: 1.6 }}>{config.footer}</p>
            <p style={{ margin: 0, fontSize: 13, color: ui.paragraph.color, lineHeight: 1.6 }}>Theme ativo: {themeName}</p>
          </footer>
        </section>
      </DashboardMarker>
    </DashboardTemplateMarker>
  )
}

const CLASSIC_DASHBOARD_VARIANT: StandaloneDashboardVariant = {
  fileName: 'dashboard-classico.tsx',
  name: 'dashboard_classico',
  path: 'app/dashboard-classico.tsx',
  title: 'Dashboard Classico',
}

function buildClassicDashboardTemplateSource(themeName: string) {
  const ui = buildDashboardThemeUi(themeName, 'classic')
  const cardFrameSource = buildFramePropSource(ui.cardFrame)
  return `export function DashboardClassico() {
  return (
    <DashboardTemplate name="${CLASSIC_DASHBOARD_VARIANT.name}" title="${CLASSIC_DASHBOARD_VARIANT.title}">
      <Theme name="${themeName}" />
      <Dashboard id="overview" title="${CLASSIC_DASHBOARD_VARIANT.title}">
        <section style={${JSON.stringify(ui.page)}}>
          <header style={${JSON.stringify(ui.header)}}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <p style={${JSON.stringify({ ...ui.metricLabel, letterSpacing: '0.08em' })}}>Executive dashboard</p>
              <h1 style={{ margin: 0, fontSize: 34, lineHeight: 1.05, fontWeight: 700, letterSpacing: '-0.04em', color: '${String(ui.title.color || '')}' }}>Performance overview with the classic BI layout</h1>
              <p style={${JSON.stringify({ ...ui.paragraph, maxWidth: 720, lineHeight: 1.65 })}}>
                Header with global period control, KPI strip on top and analysis rows below. The runtime stays JSX-first, but the surface looks closer to the previous dashboard model.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 10, minWidth: 240 }}>
              <p style={${JSON.stringify({ ...ui.eyebrow, letterSpacing: '0.06em' })}}>Global period</p>
              <DatePicker label="Periodo do pedido" table="vendas.pedidos" field="data_pedido" presets={['7d', '30d', 'month', 'quarter']} />
            </div>
          </header>

          <section style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0, 1fr))', gap: 14 }}>
            <Query
              dataQuery={{
                query: \`
                  SELECT COALESCE(SUM(p.valor_total), 0)::float AS value
                  FROM vendas.pedidos p
                  WHERE 1=1
                    {{filters:p}}
                \`,
                limit: 1,
              }}
              format="currency"
              comparisonMode="previous_period"
            >
              <Card${cardFrameSource} style={${JSON.stringify(ui.queryCard)}}>
                <p data-ui="eyebrow" style={{ margin: 0 }}>Receita</p>
                <p data-ui="kpi-value" style={{ margin: 0, fontSize: 28 }}>{'{{query.valueFormatted}}'}</p>
                <p data-ui="kpi-delta" style={${JSON.stringify(ui.kpiDelta)}}>{'{{query.deltaPercentDisplay}} {{query.comparisonLabel}}'}</p>
              </Card>
            </Query>

            <Query
              dataQuery={{
                query: \`
                  SELECT COUNT(*)::float AS value
                  FROM vendas.pedidos p
                  WHERE 1=1
                    {{filters:p}}
                \`,
                limit: 1,
              }}
              format="number"
              comparisonMode="previous_period"
            >
              <Card${cardFrameSource} style={${JSON.stringify(ui.queryCard)}}>
                <p data-ui="eyebrow" style={{ margin: 0 }}>Pedidos</p>
                <p data-ui="kpi-value" style={{ margin: 0, fontSize: 28 }}>{'{{query.valueFormatted}}'}</p>
                <p data-ui="kpi-delta" style={${JSON.stringify(ui.kpiDelta)}}>{'{{query.deltaPercentDisplay}} {{query.comparisonLabel}}'}</p>
              </Card>
            </Query>

            <Query
              dataQuery={{
                query: \`
                  SELECT COALESCE(AVG(p.valor_total), 0)::float AS value
                  FROM vendas.pedidos p
                  WHERE 1=1
                    {{filters:p}}
                \`,
                limit: 1,
              }}
              format="currency"
              comparisonMode="previous_period"
            >
              <Card${cardFrameSource} style={${JSON.stringify(ui.queryCard)}}>
                <p data-ui="eyebrow" style={{ margin: 0 }}>Ticket medio</p>
                <p data-ui="kpi-value" style={{ margin: 0, fontSize: 28 }}>{'{{query.valueFormatted}}'}</p>
                <p data-ui="kpi-delta" style={${JSON.stringify(ui.kpiDelta)}}>{'{{query.deltaPercentDisplay}} {{query.comparisonLabel}}'}</p>
              </Card>
            </Query>

            <Query
              dataQuery={{
                query: \`
                  SELECT COUNT(DISTINCT p.canal_venda_id)::float AS value
                  FROM vendas.pedidos p
                  WHERE 1=1
                    {{filters:p}}
                \`,
                limit: 1,
              }}
              format="number"
              comparisonMode="previous_period"
            >
              <Card${cardFrameSource} style={${JSON.stringify(ui.queryCard)}}>
                <p data-ui="eyebrow" style={{ margin: 0 }}>Canais ativos</p>
                <p data-ui="kpi-value" style={{ margin: 0, fontSize: 28 }}>{'{{query.valueFormatted}}'}</p>
                <p data-ui="kpi-delta" style={${JSON.stringify(ui.kpiDelta)}}>{'{{query.deltaPercentDisplay}} {{query.comparisonLabel}}'}</p>
              </Card>
            </Query>

            <Query
              dataQuery={{
                query: \`
                  SELECT COALESCE(AVG(CASE WHEN COALESCE(p.status, '') = 'aprovado' THEN 1 ELSE 0 END), 0)::float AS value
                  FROM vendas.pedidos p
                  WHERE 1=1
                    {{filters:p}}
                \`,
                limit: 1,
              }}
              format="percent"
              comparisonMode="previous_period"
            >
              <Card${cardFrameSource} style={${JSON.stringify(ui.queryCard)}}>
                <p data-ui="eyebrow" style={{ margin: 0 }}>Aprovacao</p>
                <p data-ui="kpi-value" style={{ margin: 0, fontSize: 28 }}>{'{{query.valueFormatted}}'}</p>
                <p data-ui="kpi-delta" style={${JSON.stringify(ui.kpiDelta)}}>{'{{query.deltaPercentDisplay}} {{query.comparisonLabel}}'}</p>
              </Card>
            </Query>
          </section>

          <section style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 18 }}>
            <Card${cardFrameSource} style={${JSON.stringify(ui.panelCard)}}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <p data-ui="eyebrow" style={{ margin: 0 }}>Receita por canal</p>
                <h2 data-ui="title" style={{ margin: 0, fontSize: 22 }}>Mix comercial</h2>
              </div>
              <Chart
                type="bar"
                height={300}
                format="currency"
                dataQuery={{
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
                  limit: 6,
                }}
                interaction={{ table: 'vendas.pedidos', field: 'canal_venda_id', clearOnSecondClick: true }}
                colorScheme={['#2563EB', '#60A5FA', '#93C5FD', '#BFDBFE']}
                recharts={{ categoryLabelMode: 'first-word', valueAxisWidth: 72 }}
              />
            </Card>

            <Card${cardFrameSource} style={${JSON.stringify(ui.panelCardAlt)}}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <p data-ui="eyebrow" style={{ margin: 0 }}>Participacao</p>
                <h2 data-ui="title" style={{ margin: 0, fontSize: 22 }}>Share por canal</h2>
              </div>
              <Chart
                type="pie"
                height={300}
                format="currency"
                dataQuery={{
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
                  limit: 6,
                }}
                interaction={{ table: 'vendas.pedidos', field: 'canal_venda_id', clearOnSecondClick: true }}
                colorScheme={['#2563EB', '#0F766E', '#EA580C', '#7C3AED', '#DC2626']}
                recharts={{ innerRadius: 56, outerRadius: 96, showLabels: false, legendPosition: 'right' }}
              />
            </Card>
          </section>

          <section style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 18 }}>
            <Card${cardFrameSource} style={{ ...${JSON.stringify(ui.panelCard)}, minHeight: '100%' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <p data-ui="eyebrow" style={{ margin: 0 }}>Tendencia diaria</p>
                <h2 data-ui="title" style={{ margin: 0, fontSize: 22 }}>Receita ao longo do periodo</h2>
              </div>
              <div style={{ flex: 1, minHeight: 300 }}>
                <Chart
                  type="line"
                  height="100%"
                  format="currency"
                  dataQuery={{
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
                  }}
                  colorScheme={['#2563EB', '#60A5FA', '#93C5FD']}
                  recharts={{ showDots: false, singleSeriesGradient: true, valueAxisWidth: 72 }}
                />
              </div>
            </Card>

            <Card${cardFrameSource} data-ui="table-card" style={${JSON.stringify(ui.panelCard)}}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <p data-ui="eyebrow" style={{ margin: 0 }}>Detalhamento</p>
                <h2 data-ui="title" style={{ margin: 0, fontSize: 22 }}>Pedidos filtrados</h2>
              </div>
              <Table
                bordered
                rounded
                stickyHeader
                dataQuery={{
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
                }}
                columns={[
                  { accessorKey: 'pedido_id', header: 'Pedido' },
                  { accessorKey: 'data_pedido', header: 'Data' },
                  { accessorKey: 'canal', header: 'Canal' },
                  { accessorKey: 'status', header: 'Status', cell: 'badge', meta: { variantMap: { aprovado: 'success', pendente: 'warning', cancelado: 'danger' } } },
                  { accessorKey: 'valor_total', header: 'Receita', format: 'currency', align: 'right', headerAlign: 'right' },
                ]}
                enableExportCsv
              />
            </Card>
          </section>

          <section style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 18 }}>
            <Card${cardFrameSource} style={${JSON.stringify(ui.panelCard)}}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <p data-ui="eyebrow" style={{ margin: 0 }}>Status mix</p>
                <h2 data-ui="title" style={{ margin: 0, fontSize: 22 }}>Volume por status</h2>
              </div>
              <Chart
                type="horizontal-bar"
                height={300}
                format="number"
                dataQuery={{
                  query: \`
                    SELECT
                      COALESCE(p.status, 'Sem status') AS label,
                      COUNT(*)::float AS value
                    FROM vendas.pedidos p
                    WHERE 1=1
                      {{filters:p}}
                    GROUP BY 1
                    ORDER BY 2 DESC
                  \`,
                  xField: 'label',
                  yField: 'value',
                  limit: 8,
                }}
                colorScheme={['#2563EB', '#60A5FA', '#93C5FD', '#BFDBFE']}
              />
            </Card>

            <Card${cardFrameSource} data-ui="pivot-card" style={${JSON.stringify(ui.panelCardAlt)}}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <p data-ui="eyebrow" style={{ margin: 0 }}>Cruzamento</p>
                <h2 data-ui="title" style={{ margin: 0, fontSize: 22 }}>Receita por canal e status</h2>
              </div>
              <PivotTable
                bordered
                rounded
                stickyHeader
                enableExportCsv
                defaultExpandedLevels={1}
                dataQuery={{
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
                }}
                rows={[{ field: 'canal', label: 'Canal' }]}
                columns={[{ field: 'status', label: 'Status' }]}
                values={[{ field: 'valor_total', label: 'Receita', aggregate: 'sum', format: 'currency' }]}
              />
            </Card>
          </section>
        </section>
      </Dashboard>
    </DashboardTemplate>
  )
}`
}

function buildClassicDashboardTemplate(themeName: string) {
  const ui = buildDashboardThemeUi(themeName, 'classic')
  return (
    <DashboardTemplateMarker name={CLASSIC_DASHBOARD_VARIANT.name} title={CLASSIC_DASHBOARD_VARIANT.title}>
      <ThemeMarker name={themeName} />
      <DashboardMarker id="overview" title={CLASSIC_DASHBOARD_VARIANT.title}>
        <section style={ui.page}>
          <header style={ui.header}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <p style={{ ...ui.metricLabel, letterSpacing: '0.08em' }}>Executive dashboard</p>
              <h1 style={{ margin: 0, fontSize: 34, lineHeight: 1.05, fontWeight: 700, letterSpacing: '-0.04em', color: ui.title.color }}>Performance overview with the classic BI layout</h1>
              <p style={{ ...ui.paragraph, maxWidth: 720, lineHeight: 1.65 }}>
                Header with global period control, KPI strip on top and analysis rows below. The runtime stays JSX-first, but the surface looks closer to the previous dashboard model.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 10, minWidth: 240 }}>
              <p style={{ ...ui.eyebrow, letterSpacing: '0.06em' }}>Global period</p>
              <DatePickerMarker label="Periodo do pedido" table="vendas.pedidos" field="data_pedido" presets={['7d', '30d', 'month', 'quarter']} />
            </div>
          </header>

          <section style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0, 1fr))', gap: 14 }}>
            <QueryMarker dataQuery={{ query: `
                  SELECT COALESCE(SUM(p.valor_total), 0)::float AS value
                  FROM vendas.pedidos p
                  WHERE 1=1
                    {{filters:p}}
                `, limit: 1 }} format="currency" comparisonMode="previous_period">
              <Card frame={ui.cardFrame || undefined} style={ui.queryCard}>
                <p data-ui="eyebrow" style={{ margin: 0 }}>Receita</p>
                <p data-ui="kpi-value" style={{ margin: 0, fontSize: 28 }}>{'{{query.valueFormatted}}'}</p>
                <p data-ui="kpi-delta" style={ui.kpiDelta}>{'{{query.deltaPercentDisplay}} {{query.comparisonLabel}}'}</p>
              </Card>
            </QueryMarker>

            <QueryMarker dataQuery={{ query: `
                  SELECT COUNT(*)::float AS value
                  FROM vendas.pedidos p
                  WHERE 1=1
                    {{filters:p}}
                `, limit: 1 }} format="number" comparisonMode="previous_period">
              <Card frame={ui.cardFrame || undefined} style={ui.queryCard}>
                <p data-ui="eyebrow" style={{ margin: 0 }}>Pedidos</p>
                <p data-ui="kpi-value" style={{ margin: 0, fontSize: 28 }}>{'{{query.valueFormatted}}'}</p>
                <p data-ui="kpi-delta" style={ui.kpiDelta}>{'{{query.deltaPercentDisplay}} {{query.comparisonLabel}}'}</p>
              </Card>
            </QueryMarker>

            <QueryMarker dataQuery={{ query: `
                  SELECT COALESCE(AVG(p.valor_total), 0)::float AS value
                  FROM vendas.pedidos p
                  WHERE 1=1
                    {{filters:p}}
                `, limit: 1 }} format="currency" comparisonMode="previous_period">
              <Card frame={ui.cardFrame || undefined} style={ui.queryCard}>
                <p data-ui="eyebrow" style={{ margin: 0 }}>Ticket medio</p>
                <p data-ui="kpi-value" style={{ margin: 0, fontSize: 28 }}>{'{{query.valueFormatted}}'}</p>
                <p data-ui="kpi-delta" style={ui.kpiDelta}>{'{{query.deltaPercentDisplay}} {{query.comparisonLabel}}'}</p>
              </Card>
            </QueryMarker>

            <QueryMarker dataQuery={{ query: `
                  SELECT COUNT(DISTINCT p.canal_venda_id)::float AS value
                  FROM vendas.pedidos p
                  WHERE 1=1
                    {{filters:p}}
                `, limit: 1 }} format="number" comparisonMode="previous_period">
              <Card frame={ui.cardFrame || undefined} style={ui.queryCard}>
                <p data-ui="eyebrow" style={{ margin: 0 }}>Canais ativos</p>
                <p data-ui="kpi-value" style={{ margin: 0, fontSize: 28 }}>{'{{query.valueFormatted}}'}</p>
                <p data-ui="kpi-delta" style={ui.kpiDelta}>{'{{query.deltaPercentDisplay}} {{query.comparisonLabel}}'}</p>
              </Card>
            </QueryMarker>

            <QueryMarker dataQuery={{ query: `
                  SELECT COALESCE(AVG(CASE WHEN COALESCE(p.status, '') = 'aprovado' THEN 1 ELSE 0 END), 0)::float AS value
                  FROM vendas.pedidos p
                  WHERE 1=1
                    {{filters:p}}
                `, limit: 1 }} format="percent" comparisonMode="previous_period">
              <Card frame={ui.cardFrame || undefined} style={ui.queryCard}>
                <p data-ui="eyebrow" style={{ margin: 0 }}>Aprovacao</p>
                <p data-ui="kpi-value" style={{ margin: 0, fontSize: 28 }}>{'{{query.valueFormatted}}'}</p>
                <p data-ui="kpi-delta" style={ui.kpiDelta}>{'{{query.deltaPercentDisplay}} {{query.comparisonLabel}}'}</p>
              </Card>
            </QueryMarker>
          </section>

          <section style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 18 }}>
            <Card frame={ui.cardFrame || undefined} style={ui.panelCard}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <p data-ui="eyebrow" style={{ margin: 0 }}>Receita por canal</p>
                <h2 data-ui="title" style={{ margin: 0, fontSize: 22 }}>Mix comercial</h2>
              </div>
              <ChartMarker
                type="bar"
                height={300}
                format="currency"
                dataQuery={{
                  query: `
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
                  `,
                  xField: 'label',
                  yField: 'value',
                  keyField: 'key',
                  limit: 6,
                }}
                interaction={SALES_CHANNEL_INTERACTION}
                colorScheme={['#2563EB', '#60A5FA', '#93C5FD', '#BFDBFE']}
                recharts={{ categoryLabelMode: 'first-word', valueAxisWidth: 72 }}
              />
            </Card>

            <Card frame={ui.cardFrame || undefined} style={ui.panelCardAlt}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <p data-ui="eyebrow" style={{ margin: 0 }}>Participacao</p>
                <h2 data-ui="title" style={{ margin: 0, fontSize: 22 }}>Share por canal</h2>
              </div>
              <ChartMarker
                type="pie"
                height={300}
                format="currency"
                dataQuery={{
                  query: `
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
                  `,
                  xField: 'label',
                  yField: 'value',
                  keyField: 'key',
                  limit: 6,
                }}
                interaction={SALES_CHANNEL_INTERACTION}
                colorScheme={['#2563EB', '#0F766E', '#EA580C', '#7C3AED', '#DC2626']}
                recharts={{ innerRadius: 56, outerRadius: 96, showLabels: false, legendPosition: 'right' }}
              />
            </Card>
          </section>

          <section style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 18 }}>
            <Card frame={ui.cardFrame || undefined} style={{ ...ui.panelCard, minHeight: '100%' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <p data-ui="eyebrow" style={{ margin: 0 }}>Tendencia diaria</p>
                <h2 data-ui="title" style={{ margin: 0, fontSize: 22 }}>Receita ao longo do periodo</h2>
              </div>
              <div style={{ flex: 1, minHeight: 300 }}>
                <ChartMarker
                  type="line"
                  height="100%"
                  format="currency"
                  dataQuery={{
                    query: `
                      SELECT
                        TO_CHAR(p.data_pedido::date, 'YYYY-MM-DD') AS key,
                        TO_CHAR(p.data_pedido::date, 'DD/MM') AS label,
                        COALESCE(SUM(p.valor_total), 0)::float AS value
                      FROM vendas.pedidos p
                      WHERE 1=1
                        {{filters:p}}
                      GROUP BY 1, 2
                      ORDER BY 1 ASC
                    `,
                    xField: 'label',
                    yField: 'value',
                    keyField: 'key',
                    limit: 31,
                  }}
                  colorScheme={['#2563EB', '#60A5FA', '#93C5FD']}
                  recharts={{ showDots: false, singleSeriesGradient: true, valueAxisWidth: 72 }}
                />
              </div>
            </Card>

            <Card frame={ui.cardFrame || undefined} data-ui="table-card" style={ui.panelCard}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <p data-ui="eyebrow" style={{ margin: 0 }}>Detalhamento</p>
                <h2 data-ui="title" style={{ margin: 0, fontSize: 22 }}>Pedidos filtrados</h2>
              </div>
              <TableMarker
                bordered
                rounded
                stickyHeader
                dataQuery={{
                  query: `
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
                  `,
                  limit: 12,
                }}
                columns={[
                  { accessorKey: 'pedido_id', header: 'Pedido' },
                  { accessorKey: 'data_pedido', header: 'Data' },
                  { accessorKey: 'canal', header: 'Canal' },
                  { accessorKey: 'status', header: 'Status', cell: 'badge', meta: { variantMap: { aprovado: 'success', pendente: 'warning', cancelado: 'danger' } } },
                  { accessorKey: 'valor_total', header: 'Receita', format: 'currency', align: 'right', headerAlign: 'right' },
                ]}
                enableExportCsv
              />
            </Card>
          </section>

          <section style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 18 }}>
            <Card frame={ui.cardFrame || undefined} style={ui.panelCard}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <p data-ui="eyebrow" style={{ margin: 0 }}>Status mix</p>
                <h2 data-ui="title" style={{ margin: 0, fontSize: 22 }}>Volume por status</h2>
              </div>
              <ChartMarker
                type="horizontal-bar"
                height={300}
                format="number"
                dataQuery={{
                  query: `
                    SELECT
                      COALESCE(p.status, 'Sem status') AS label,
                      COUNT(*)::float AS value
                    FROM vendas.pedidos p
                    WHERE 1=1
                      {{filters:p}}
                    GROUP BY 1
                    ORDER BY 2 DESC
                  `,
                  xField: 'label',
                  yField: 'value',
                  limit: 8,
                }}
                colorScheme={['#2563EB', '#60A5FA', '#93C5FD', '#BFDBFE']}
              />
            </Card>

            <Card frame={ui.cardFrame || undefined} data-ui="pivot-card" style={ui.panelCardAlt}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <p data-ui="eyebrow" style={{ margin: 0 }}>Cruzamento</p>
                <h2 data-ui="title" style={{ margin: 0, fontSize: 22 }}>Receita por canal e status</h2>
              </div>
              <PivotTableMarker
                bordered
                rounded
                stickyHeader
                enableExportCsv
                defaultExpandedLevels={1}
                dataQuery={{
                  query: `
                    SELECT
                      COALESCE(cv.nome, '-') AS canal,
                      COALESCE(p.status, 'Sem status') AS status,
                      COALESCE(p.valor_total, 0)::float AS valor_total
                    FROM vendas.pedidos p
                    LEFT JOIN vendas.canais_venda cv ON cv.id = p.canal_venda_id
                    WHERE 1=1
                      {{filters:p}}
                  `,
                  limit: 400,
                }}
                rows={[{ field: 'canal', label: 'Canal' }]}
                columns={[{ field: 'status', label: 'Status' }]}
                values={[{ field: 'valor_total', label: 'Receita', aggregate: 'sum', format: 'currency' }]}
              />
            </Card>
          </section>
        </section>
      </DashboardMarker>
    </DashboardTemplateMarker>
  )
}

export function buildDashboardTemplateVariants(themeName: string): DashboardTemplateVariant[] {
  const variants = DASHBOARD_VARIANTS.map((variant) => {
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

  const classicTree = jsxToTree(buildClassicDashboardTemplate(themeName))
  if (!classicTree || typeof classicTree === 'string') {
    throw new Error(`Invalid dashboard template root for ${CLASSIC_DASHBOARD_VARIANT.name}`)
  }

  variants.push({
    content: buildClassicDashboardTemplateSource(themeName),
    name: CLASSIC_DASHBOARD_VARIANT.fileName,
    path: CLASSIC_DASHBOARD_VARIANT.path,
    tree: classicTree,
  })

  return variants
}
