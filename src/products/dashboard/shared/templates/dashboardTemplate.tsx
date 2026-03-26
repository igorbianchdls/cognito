'use client'

import React, { isValidElement, ReactNode } from 'react'
import { buildThemeVars } from '@/products/bi/json-render/theme/themeAdapter'
import { buildComprasDashboardTemplateVariant } from '@/products/dashboard/shared/templates/dashboardComprasTemplate'
import { buildFinanceiroDashboardTemplateVariant } from '@/products/dashboard/shared/templates/dashboardFinanceiroTemplate'
import { buildGoogleAdsDashboardTemplateVariant } from '@/products/dashboard/shared/templates/dashboardGoogleAdsTemplate'
import { buildMetaAdsDashboardTemplateVariant } from '@/products/dashboard/shared/templates/dashboardMetaAdsTemplate'
import { buildShopifyDashboardTemplateVariant } from '@/products/dashboard/shared/templates/dashboardShopifyTemplate'

type MarkerProps = {
  children?: ReactNode
  id?: string
  name?: string
  title?: string
}

type BarChartMarkerProps = {
  colors?: string[]
  dataQuery?: Record<string, unknown>
  format?: 'currency' | 'number' | 'percent'
  height?: number | string
  grid?: Record<string, unknown>
  interaction?: Record<string, unknown>
  legend?: Record<string, unknown>
  series?: Record<string, unknown>
  tooltip?: Record<string, unknown>
  xAxis?: Record<string, unknown>
  yAxis?: Record<string, unknown>
}

type LineChartMarkerProps = BarChartMarkerProps
type PieChartMarkerProps = BarChartMarkerProps
type ChartMarkerProps = BarChartMarkerProps & {
  type: string
}
type WidgetMarkerProps = {
  [key: string]: unknown
}
type InsightsMarkerProps = WidgetMarkerProps & {
  items?: Array<Record<string, unknown>>
}
type TextMarkerProps = MarkerProps &
  WidgetMarkerProps & {
    as?: string
    type?: string
    color?: string
    fontSize?: number | string
    fontWeight?: number | string
    fontFamily?: string
    letterSpacing?: number | string
    lineHeight?: number | string
    textTransform?: string
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

function Text({ children }: TextMarkerProps) {
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

function InsightsMarker(_: InsightsMarkerProps) {
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
Text.displayName = 'Text'
KpiMarker.displayName = 'KPI'
QueryMarker.displayName = 'Query'
TableMarker.displayName = 'Table'
PivotTableMarker.displayName = 'PivotTable'
InsightsMarker.displayName = 'Insights'
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
  headerDatePickerLabel: React.CSSProperties
  headerDatePickerField: React.CSSProperties
  headerDatePickerIcon: React.CSSProperties
  headerDatePickerPreset: React.CSSProperties
  headerDatePickerPresetActive: React.CSSProperties
  headerDatePickerSeparator: React.CSSProperties
  tableHeaderStyle: React.CSSProperties
  tableRowStyle: React.CSSProperties
  tableCellStyle: React.CSSProperties
  tableFooterStyle: React.CSSProperties
  tableHeaderBackground: string
  tableHeaderTextColor: string
  tableBorderColor: string
  tableCellTextColor: string
  tableRowHoverColor: string
  tableRowAlternateBgColor: string
  tableFooterBackground: string
  tableFooterTextColor: string
  pivotContainerStyle: React.CSSProperties
  pivotHeaderStyle: React.CSSProperties
  pivotHeaderTotalStyle: React.CSSProperties
  pivotRowLabelStyle: React.CSSProperties
  pivotCellStyle: React.CSSProperties
  pivotRowTotalStyle: React.CSSProperties
  pivotFooterStyle: React.CSSProperties
  pivotEmptyStateStyle: React.CSSProperties
  pivotExpandButtonStyle: React.CSSProperties
  pivotBackgroundColor: string
  pivotHeaderBackground: string
  pivotHeaderTextColor: string
  pivotHeaderTotalBackground: string
  pivotHeaderTotalTextColor: string
  pivotCellTextColor: string
  pivotRowLabelColor: string
  pivotRowTotalBackground: string
  pivotRowTotalTextColor: string
  pivotFooterBackground: string
  pivotFooterTextColor: string
  pivotMutedTextColor: string
  pivotExpandButtonBackground: string
  pivotExpandButtonBorderColor: string
  pivotExpandButtonColor: string
  pivotExpandButtonHoverBackground: string
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
  const headerDpBg = String(cssVars.headerDpBg || headerBg)
  const headerDpColor = String(cssVars.headerDpColor || headerText)
  const headerDpBorder = String(cssVars.headerDpBorder || borderColor)
  const headerDpIcon = String(cssVars.headerDpIcon || headerDpColor)
  const headerDpLabel = String(cssVars.headerDpLabel || headerSubtitle)
  const accentSurface = `color-mix(in srgb, ${surfaceBg} 84%, ${primary} 16%)`
  const accentBorder = `color-mix(in srgb, ${borderColor} 60%, ${primary} 40%)`
  const accentText = dark ? '#FFFFFF' : primary
  const headerDpActiveBg = `color-mix(in srgb, ${headerDpBg} 72%, ${primary} 28%)`
  const headerDpActiveBorder = `color-mix(in srgb, ${headerDpBorder} 55%, ${primary} 45%)`
  const headerDpActiveColor = dark ? '#FFFFFF' : primary
  const tableHeaderBackground = '#f8fafc'
  const tableHeaderTextColor = '#334155'
  const tableBorderColor = '#d7dbe3'
  const tableCellTextColor = '#475569'
  const tableRowHoverColor = '#f8fafc'
  const tableRowAlternateBgColor = '#ffffff'
  const tableFooterBackground = '#f8fafc'
  const tableFooterTextColor = '#0f172a'
  const pivotBackgroundColor = '#ffffff'
  const pivotHeaderBackground = '#f8fafc'
  const pivotHeaderTextColor = '#334155'
  const pivotHeaderTotalBackground = '#f1f5f9'
  const pivotHeaderTotalTextColor = '#1e293b'
  const pivotCellTextColor = '#475569'
  const pivotRowLabelColor = '#1e293b'
  const pivotRowTotalBackground = '#f8fafc'
  const pivotRowTotalTextColor = '#1e293b'
  const pivotFooterBackground = '#f1f5f9'
  const pivotFooterTextColor = '#0f172a'
  const pivotMutedTextColor = '#64748b'
  const pivotExpandButtonBackground = '#ffffff'
  const pivotExpandButtonBorderColor = '#e5e7eb'
  const pivotExpandButtonColor = '#475569'
  const pivotExpandButtonHoverBackground = '#f8fafc'
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
    headerDatePickerLabel: {
      margin: 0,
      fontSize: 11,
      color: headerDpLabel,
      textTransform: 'uppercase',
      letterSpacing: '0.06em',
    },
    headerDatePickerField: {
      minHeight: 38,
      padding: '0 10px',
      border: `1px solid ${headerDpBorder}`,
      borderRadius: 10,
      backgroundColor: headerDpBg,
      color: headerDpColor,
      fontSize: 14,
      fontWeight: 500,
    },
    headerDatePickerIcon: {
      color: headerDpIcon,
      fontSize: 14,
    },
    headerDatePickerPreset: {
      height: 36,
      padding: '0 12px',
      border: `1px solid ${headerDpBorder}`,
      borderRadius: 10,
      backgroundColor: headerDpBg,
      color: headerDpColor,
      fontSize: 13,
      fontWeight: 500,
    },
    headerDatePickerPresetActive: {
      backgroundColor: headerDpActiveBg,
      borderColor: headerDpActiveBorder,
      color: headerDpActiveColor,
      fontWeight: 600,
    },
    headerDatePickerSeparator: {
      color: headerDpLabel,
      fontSize: 13,
      fontWeight: 500,
    },
    tableHeaderStyle: {
      backgroundColor: tableHeaderBackground,
      color: tableHeaderTextColor,
      fontSize: 14,
      fontWeight: 600,
      padding: '12px 14px',
    },
    tableRowStyle: {
      backgroundColor: '#ffffff',
    },
    tableCellStyle: {
      color: tableCellTextColor,
      fontSize: 14,
      fontWeight: 400,
      padding: '12px 14px',
    },
    tableFooterStyle: {
      backgroundColor: tableFooterBackground,
      color: tableFooterTextColor,
      fontSize: 14,
      fontWeight: 600,
      padding: '12px 14px',
    },
    pivotContainerStyle: {
      backgroundColor: pivotBackgroundColor,
    },
    pivotHeaderStyle: {
      backgroundColor: pivotHeaderBackground,
      color: pivotHeaderTextColor,
      fontSize: 14,
      fontWeight: 600,
      padding: '9px 10px',
    },
    pivotHeaderTotalStyle: {
      backgroundColor: pivotHeaderTotalBackground,
      color: pivotHeaderTotalTextColor,
      fontSize: 14,
      fontWeight: 600,
      padding: '9px 10px',
    },
    pivotRowLabelStyle: {
      backgroundColor: pivotBackgroundColor,
      color: pivotRowLabelColor,
      fontSize: 14,
      padding: '9px 10px',
    },
    pivotCellStyle: {
      backgroundColor: pivotBackgroundColor,
      color: pivotCellTextColor,
      fontSize: 14,
      padding: '9px 10px',
    },
    pivotRowTotalStyle: {
      backgroundColor: pivotRowTotalBackground,
      color: pivotRowTotalTextColor,
      fontSize: 14,
      fontWeight: 500,
      padding: '9px 10px',
    },
    pivotFooterStyle: {
      backgroundColor: pivotFooterBackground,
      color: pivotFooterTextColor,
      fontSize: 14,
      fontWeight: 600,
      padding: '9px 10px',
    },
    pivotEmptyStateStyle: {
      color: pivotMutedTextColor,
      fontSize: 14,
      padding: '18px 12px',
    },
    pivotExpandButtonStyle: {
      backgroundColor: pivotExpandButtonBackground,
      borderColor: pivotExpandButtonBorderColor,
      color: pivotExpandButtonColor,
      hoverBackgroundColor: pivotExpandButtonHoverBackground,
    } as React.CSSProperties,
    tableHeaderBackground,
    tableHeaderTextColor,
    tableBorderColor,
    tableCellTextColor,
    tableRowHoverColor,
    tableRowAlternateBgColor,
    tableFooterBackground,
    tableFooterTextColor,
    pivotBackgroundColor,
    pivotHeaderBackground,
    pivotHeaderTextColor,
    pivotHeaderTotalBackground,
    pivotHeaderTotalTextColor,
    pivotCellTextColor,
    pivotRowLabelColor,
    pivotRowTotalBackground,
    pivotRowTotalTextColor,
    pivotFooterBackground,
    pivotFooterTextColor,
    pivotMutedTextColor,
    pivotExpandButtonBackground,
    pivotExpandButtonBorderColor,
    pivotExpandButtonColor,
    pivotExpandButtonHoverBackground,
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
                    colors={['#2563EB', '#60A5FA', '#93C5FD', '#BFDBFE']}
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
                    xAxis={{ labelMode: 'first-word' }}
                    yAxis={{ width: 72 }}
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
                    colors={['#2563EB', '#0F766E', '#EA580C', '#7C3AED', '#DC2626']}
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
                    legend={{ enabled: true, position: 'right' }}
                    series={{ innerRadius: 52, outerRadius: 92, paddingAngle: 2, showLabels: false }}
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
                    colors={['#2563EB', '#60A5FA', '#93C5FD']}
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
                    yAxis={{ width: 72 }}
                    series={{ showDots: false, singleSeriesGradient: true }}
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
                    striped={false}
                    borderColor={${JSON.stringify(ui.tableBorderColor)}}
                    rowHoverColor={${JSON.stringify(ui.tableRowHoverColor)}}
                    headerStyle={${JSON.stringify(ui.tableHeaderStyle)}}
                    rowStyle={${JSON.stringify(ui.tableRowStyle)}}
                    cellStyle={${JSON.stringify(ui.tableCellStyle)}}
                    footerStyle={${JSON.stringify(ui.tableFooterStyle)}}
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
                    borderColor={${JSON.stringify(ui.tableBorderColor)}}
                    containerStyle={${JSON.stringify(ui.pivotContainerStyle)}}
                    headerStyle={${JSON.stringify(ui.pivotHeaderStyle)}}
                    headerTotalStyle={${JSON.stringify(ui.pivotHeaderTotalStyle)}}
                    rowLabelStyle={${JSON.stringify(ui.pivotRowLabelStyle)}}
                    cellStyle={${JSON.stringify(ui.pivotCellStyle)}}
                    rowTotalStyle={${JSON.stringify(ui.pivotRowTotalStyle)}}
                    footerStyle={${JSON.stringify(ui.pivotFooterStyle)}}
                    emptyStateStyle={${JSON.stringify(ui.pivotEmptyStateStyle)}}
                    expandButtonStyle={${JSON.stringify(ui.pivotExpandButtonStyle)}}
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
                    colors={ui.chartScheme}
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
                    xAxis={{ labelMode: 'first-word' }}
                    yAxis={{ width: 72 }}
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
                    colors={ui.chartScheme}
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
                    legend={{ enabled: true, position: 'right' }}
                    series={{ innerRadius: 52, outerRadius: 92, paddingAngle: 2, showLabels: false }}
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
                    colors={ui.chartScheme}
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
                    yAxis={{ width: 72 }}
                    series={{ showDots: false, singleSeriesGradient: true }}
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
                    striped={false}
                    borderColor={ui.tableBorderColor}
                    rowHoverColor={ui.tableRowHoverColor}
                    headerStyle={ui.tableHeaderStyle}
                    rowStyle={ui.tableRowStyle}
                    cellStyle={ui.tableCellStyle}
                    footerStyle={ui.tableFooterStyle}
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
                    borderColor={ui.tableBorderColor}
                    containerStyle={ui.pivotContainerStyle}
                    headerStyle={ui.pivotHeaderStyle}
                    headerTotalStyle={ui.pivotHeaderTotalStyle}
                    rowLabelStyle={ui.pivotRowLabelStyle}
                    cellStyle={ui.pivotCellStyle}
                    rowTotalStyle={ui.pivotRowTotalStyle}
                    footerStyle={ui.pivotFooterStyle}
                    emptyStateStyle={ui.pivotEmptyStateStyle}
                    expandButtonStyle={ui.pivotExpandButtonStyle}
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
              <p style={${JSON.stringify({ ...ui.metricLabel, margin: 0, fontSize: 12, letterSpacing: '0.08em', textTransform: 'uppercase' })}}>Executive dashboard</p>
              <h1 style={${JSON.stringify({ ...ui.title, margin: 0, fontSize: 34, lineHeight: 1.05, fontWeight: 700, letterSpacing: '-0.04em' })}}>Performance overview with the classic BI layout</h1>
              <p style={${JSON.stringify({ ...ui.paragraph, margin: 0, maxWidth: 720, fontSize: 14, lineHeight: 1.65 })}}>
                Header with global period control, KPI strip on top and analysis rows below. The runtime stays JSX-first, but the surface looks closer to the previous dashboard model.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 10, minWidth: 240 }}>
              <p style={${JSON.stringify({ ...ui.eyebrow, margin: 0, fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase' })}}>Global period</p>
              <DatePicker
                label="Periodo do pedido"
                table="vendas.pedidos"
                field="data_pedido"
                presets={['7d', '30d', 'month', 'quarter']}
                labelStyle={${JSON.stringify(ui.headerDatePickerLabel)}}
                fieldStyle={${JSON.stringify(ui.headerDatePickerField)}}
                iconStyle={${JSON.stringify(ui.headerDatePickerIcon)}}
                presetButtonStyle={${JSON.stringify(ui.headerDatePickerPreset)}}
                activePresetButtonStyle={${JSON.stringify(ui.headerDatePickerPresetActive)}}
                separatorStyle={${JSON.stringify(ui.headerDatePickerSeparator)}}
              />
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
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <p style={${JSON.stringify({ ...ui.eyebrow, margin: 0, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em' })}}>Faturamento</p>
                  <h2 style={${JSON.stringify({ ...ui.title, margin: 0, fontSize: 20, fontWeight: 600, letterSpacing: '-0.03em' })}}>Receita</h2>
                </div>
                <p style={${JSON.stringify({ ...ui.kpiValue, margin: 0, fontSize: 28, fontWeight: 700, letterSpacing: '-0.04em' })}}>{'{{query.valueFormatted}}'}</p>
                <p data-ui="kpi-delta" style={${JSON.stringify({ ...ui.kpiDelta, margin: 0, fontSize: 13 })}}>{'{{query.deltaPercentDisplay}} {{query.comparisonLabel}}'}</p>
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
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <p style={${JSON.stringify({ ...ui.eyebrow, margin: 0, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em' })}}>Volume</p>
                  <h2 style={${JSON.stringify({ ...ui.title, margin: 0, fontSize: 20, fontWeight: 600, letterSpacing: '-0.03em' })}}>Pedidos</h2>
                </div>
                <p style={${JSON.stringify({ ...ui.kpiValue, margin: 0, fontSize: 28, fontWeight: 700, letterSpacing: '-0.04em' })}}>{'{{query.valueFormatted}}'}</p>
                <p data-ui="kpi-delta" style={${JSON.stringify({ ...ui.kpiDelta, margin: 0, fontSize: 13 })}}>{'{{query.deltaPercentDisplay}} {{query.comparisonLabel}}'}</p>
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
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <p style={${JSON.stringify({ ...ui.eyebrow, margin: 0, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em' })}}>Eficiência</p>
                  <h2 style={${JSON.stringify({ ...ui.title, margin: 0, fontSize: 20, fontWeight: 600, letterSpacing: '-0.03em' })}}>Ticket medio</h2>
                </div>
                <p style={${JSON.stringify({ ...ui.kpiValue, margin: 0, fontSize: 28, fontWeight: 700, letterSpacing: '-0.04em' })}}>{'{{query.valueFormatted}}'}</p>
                <p data-ui="kpi-delta" style={${JSON.stringify({ ...ui.kpiDelta, margin: 0, fontSize: 13 })}}>{'{{query.deltaPercentDisplay}} {{query.comparisonLabel}}'}</p>
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
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <p style={${JSON.stringify({ ...ui.eyebrow, margin: 0, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em' })}}>Cobertura</p>
                  <h2 style={${JSON.stringify({ ...ui.title, margin: 0, fontSize: 20, fontWeight: 600, letterSpacing: '-0.03em' })}}>Canais ativos</h2>
                </div>
                <p style={${JSON.stringify({ ...ui.kpiValue, margin: 0, fontSize: 28, fontWeight: 700, letterSpacing: '-0.04em' })}}>{'{{query.valueFormatted}}'}</p>
                <p data-ui="kpi-delta" style={${JSON.stringify({ ...ui.kpiDelta, margin: 0, fontSize: 13 })}}>{'{{query.deltaPercentDisplay}} {{query.comparisonLabel}}'}</p>
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
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <p style={${JSON.stringify({ ...ui.eyebrow, margin: 0, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em' })}}>Qualidade</p>
                  <h2 style={${JSON.stringify({ ...ui.title, margin: 0, fontSize: 20, fontWeight: 600, letterSpacing: '-0.03em' })}}>Aprovacao</h2>
                </div>
                <p style={${JSON.stringify({ ...ui.kpiValue, margin: 0, fontSize: 28, fontWeight: 700, letterSpacing: '-0.04em' })}}>{'{{query.valueFormatted}}'}</p>
                <p data-ui="kpi-delta" style={${JSON.stringify({ ...ui.kpiDelta, margin: 0, fontSize: 13 })}}>{'{{query.deltaPercentDisplay}} {{query.comparisonLabel}}'}</p>
              </Card>
            </Query>
          </section>

          <section style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 18 }}>
            <Card${cardFrameSource} style={${JSON.stringify(ui.panelCardAlt)}}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <h2 style={${JSON.stringify({ ...ui.title, margin: 0, fontSize: 20, fontWeight: 600, letterSpacing: '-0.03em' })}}>Aceleracao recente</h2>
                <p style={${JSON.stringify({ ...ui.paragraph, margin: 0, fontSize: 13, lineHeight: 1.6 })}}>Leituras sobre os vetores que estao puxando o crescimento do periodo.</p>
              </div>
              <Insights
                textStyle={${JSON.stringify({ ...ui.paragraph, margin: 0, fontSize: 13, lineHeight: 1.65 })}}
                iconStyle={${JSON.stringify({ color: '#2563EB' })}}
                items={[
                  { title: 'Receita acima da media recente', text: 'Receita ganhou tracao nos canais proprios e manteve crescimento acima da media recente.' },
                  { title: 'Volume mais regular no periodo', text: 'O volume diario segue acima da media das ultimas semanas, com melhor distribuicao ao longo do periodo.' },
                  { title: 'Melhor retorno sem mais desconto', text: 'Os canais com melhor retorno continuam puxando o resultado total sem depender de descontos mais agressivos.' },
                ]}
              />
            </Card>
            <Card${cardFrameSource} style={${JSON.stringify(ui.panelCardAlt)}}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <h2 style={${JSON.stringify({ ...ui.title, margin: 0, fontSize: 20, fontWeight: 600, letterSpacing: '-0.03em' })}}>Concentracao de receita</h2>
                <p style={${JSON.stringify({ ...ui.paragraph, margin: 0, fontSize: 13, lineHeight: 1.6 })}}>Pontos de atencao sobre dependencia de canais e distribuicao do faturamento.</p>
              </div>
              <Insights
                textStyle={${JSON.stringify({ ...ui.paragraph, margin: 0, fontSize: 13, lineHeight: 1.65 })}}
                iconStyle={${JSON.stringify({ color: '#F59E0B' })}}
                items={[
                  { text: 'O mix segue concentrado em poucos canais, o que aumenta dependencia operacional.' },
                  { text: 'Uma variacao pequena nos principais canais ainda tem impacto relevante na receita consolidada.' },
                  { text: 'A pulverizacao do faturamento continua baixa, o que reduz margem de seguranca para os proximos ciclos.' },
                ]}
              />
            </Card>
            <Card${cardFrameSource} style={${JSON.stringify(ui.panelCardAlt)}}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <h2 style={${JSON.stringify({ ...ui.title, margin: 0, fontSize: 20, fontWeight: 600, letterSpacing: '-0.03em' })}}>Conversao e qualidade</h2>
                <p style={${JSON.stringify({ ...ui.paragraph, margin: 0, fontSize: 13, lineHeight: 1.6 })}}>Sinais de eficiencia comercial sem pressao adicional sobre o ticket medio.</p>
              </div>
              <Insights
                textStyle={${JSON.stringify({ ...ui.paragraph, margin: 0, fontSize: 13, lineHeight: 1.65 })}}
                iconStyle={${JSON.stringify({ color: '#10B981' })}}
                items={[
                  { text: 'A aprovacao continua estavel, com espaco para melhorar conversao sem pressionar o ticket medio.' },
                  { text: 'Existe espaco para elevar a taxa final com ajustes pontuais no topo do funil comercial.' },
                  { text: 'O ticket medio nao mostra deterioracao, o que permite buscar ganho de eficiencia sem comprometer valor.' },
                ]}
              />
            </Card>
          </section>

          <section style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 18 }}>
            <Card${cardFrameSource} style={${JSON.stringify(ui.panelCard)}}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <p style={${JSON.stringify({ ...ui.eyebrow, margin: 0, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em' })}}>Receita por canal</p>
                <h2 style={${JSON.stringify({ ...ui.title, margin: 0, fontSize: 22, fontWeight: 600, letterSpacing: '-0.03em' })}}>Mix comercial</h2>
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
                colors={['#2563EB', '#60A5FA', '#93C5FD', '#BFDBFE']}
                xAxis={{ labelMode: 'first-word' }}
                yAxis={{ width: 72 }}
              />
            </Card>

            <Card${cardFrameSource} style={${JSON.stringify(ui.panelCardAlt)}}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <p style={${JSON.stringify({ ...ui.eyebrow, margin: 0, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em' })}}>Participacao</p>
                <h2 style={${JSON.stringify({ ...ui.title, margin: 0, fontSize: 22, fontWeight: 600, letterSpacing: '-0.03em' })}}>Share por canal</h2>
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
                colors={['#2563EB', '#0F766E', '#EA580C', '#7C3AED', '#DC2626']}
                legend={{ enabled: true, position: 'right' }}
                series={{ innerRadius: 56, outerRadius: 96, showLabels: false }}
              />
            </Card>
          </section>

          <section style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 18 }}>
            <Card${cardFrameSource} style={{ ...${JSON.stringify(ui.panelCard)}, minHeight: '100%' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <p style={${JSON.stringify({ ...ui.eyebrow, margin: 0, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em' })}}>Tendencia diaria</p>
                <h2 style={${JSON.stringify({ ...ui.title, margin: 0, fontSize: 22, fontWeight: 600, letterSpacing: '-0.03em' })}}>Receita ao longo do periodo</h2>
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
                  colors={['#2563EB', '#60A5FA', '#93C5FD']}
                  yAxis={{ width: 72 }}
                  series={{ showDots: false, singleSeriesGradient: true }}
                />
              </div>
            </Card>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, minWidth: 0 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <p style={${JSON.stringify({ ...ui.eyebrow, margin: 0, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em' })}}>Detalhamento</p>
                <h2 style={${JSON.stringify({ ...ui.title, margin: 0, fontSize: 22, fontWeight: 600, letterSpacing: '-0.03em' })}}>Pedidos filtrados</h2>
              </div>
              <Table
                bordered
                rounded
                radius={12}
                stickyHeader
                striped={false}
                borderColor={${JSON.stringify(ui.tableBorderColor)}}
                rowHoverColor={${JSON.stringify(ui.tableRowHoverColor)}}
                headerStyle={${JSON.stringify(ui.tableHeaderStyle)}}
                rowStyle={${JSON.stringify(ui.tableRowStyle)}}
                cellStyle={${JSON.stringify(ui.tableCellStyle)}}
                footerStyle={${JSON.stringify(ui.tableFooterStyle)}}
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
            </div>
          </section>

          <section style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 18 }}>
            <Card${cardFrameSource} style={${JSON.stringify(ui.panelCard)}}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <p style={${JSON.stringify({ ...ui.eyebrow, margin: 0, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em' })}}>Status mix</p>
                <h2 style={${JSON.stringify({ ...ui.title, margin: 0, fontSize: 22, fontWeight: 600, letterSpacing: '-0.03em' })}}>Volume por status</h2>
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
                colors={['#2563EB', '#60A5FA', '#93C5FD', '#BFDBFE']}
              />
            </Card>

            <Card${cardFrameSource} data-ui="pivot-card" style={${JSON.stringify(ui.panelCardAlt)}}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <p style={${JSON.stringify({ ...ui.eyebrow, margin: 0, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em' })}}>Cruzamento</p>
                <h2 style={${JSON.stringify({ ...ui.title, margin: 0, fontSize: 22, fontWeight: 600, letterSpacing: '-0.03em' })}}>Receita por canal e status</h2>
              </div>
              <PivotTable
                bordered
                rounded
                stickyHeader
                borderColor={${JSON.stringify(ui.tableBorderColor)}}
                containerStyle={${JSON.stringify(ui.pivotContainerStyle)}}
                headerStyle={${JSON.stringify(ui.pivotHeaderStyle)}}
                headerTotalStyle={${JSON.stringify(ui.pivotHeaderTotalStyle)}}
                rowLabelStyle={${JSON.stringify(ui.pivotRowLabelStyle)}}
                cellStyle={${JSON.stringify(ui.pivotCellStyle)}}
                rowTotalStyle={${JSON.stringify(ui.pivotRowTotalStyle)}}
                footerStyle={${JSON.stringify(ui.pivotFooterStyle)}}
                emptyStateStyle={${JSON.stringify(ui.pivotEmptyStateStyle)}}
                expandButtonStyle={${JSON.stringify(ui.pivotExpandButtonStyle)}}
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
              <p style={{ ...ui.metricLabel, margin: 0, fontSize: 12, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Executive dashboard</p>
              <h1 style={{ ...ui.title, margin: 0, fontSize: 34, lineHeight: 1.05, fontWeight: 700, letterSpacing: '-0.04em' }}>Performance overview with the classic BI layout</h1>
              <p style={{ ...ui.paragraph, margin: 0, maxWidth: 720, fontSize: 14, lineHeight: 1.65 }}>
                Header with global period control, KPI strip on top and analysis rows below. The runtime stays JSX-first, but the surface looks closer to the previous dashboard model.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 10, minWidth: 240 }}>
              <p style={{ ...ui.eyebrow, margin: 0, fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Global period</p>
              <DatePickerMarker
                label="Periodo do pedido"
                table="vendas.pedidos"
                field="data_pedido"
                presets={['7d', '30d', 'month', 'quarter']}
                labelStyle={ui.headerDatePickerLabel}
                fieldStyle={ui.headerDatePickerField}
                iconStyle={ui.headerDatePickerIcon}
                presetButtonStyle={ui.headerDatePickerPreset}
                activePresetButtonStyle={ui.headerDatePickerPresetActive}
                separatorStyle={ui.headerDatePickerSeparator}
              />
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
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <p style={{ ...ui.eyebrow, margin: 0, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Faturamento</p>
                  <h2 style={{ ...ui.title, margin: 0, fontSize: 20, fontWeight: 600, letterSpacing: '-0.03em' }}>Receita</h2>
                </div>
                <p style={{ ...ui.kpiValue, margin: 0, fontSize: 28, fontWeight: 700, letterSpacing: '-0.04em' }}>{'{{query.valueFormatted}}'}</p>
                <p data-ui="kpi-delta" style={{ ...ui.kpiDelta, margin: 0, fontSize: 13 }}>{'{{query.deltaPercentDisplay}} {{query.comparisonLabel}}'}</p>
              </Card>
            </QueryMarker>

            <QueryMarker dataQuery={{ query: `
                  SELECT COUNT(*)::float AS value
                  FROM vendas.pedidos p
                  WHERE 1=1
                    {{filters:p}}
                `, limit: 1 }} format="number" comparisonMode="previous_period">
              <Card frame={ui.cardFrame || undefined} style={ui.queryCard}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <p style={{ ...ui.eyebrow, margin: 0, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Volume</p>
                  <h2 style={{ ...ui.title, margin: 0, fontSize: 20, fontWeight: 600, letterSpacing: '-0.03em' }}>Pedidos</h2>
                </div>
                <p style={{ ...ui.kpiValue, margin: 0, fontSize: 28, fontWeight: 700, letterSpacing: '-0.04em' }}>{'{{query.valueFormatted}}'}</p>
                <p data-ui="kpi-delta" style={{ ...ui.kpiDelta, margin: 0, fontSize: 13 }}>{'{{query.deltaPercentDisplay}} {{query.comparisonLabel}}'}</p>
              </Card>
            </QueryMarker>

            <QueryMarker dataQuery={{ query: `
                  SELECT COALESCE(AVG(p.valor_total), 0)::float AS value
                  FROM vendas.pedidos p
                  WHERE 1=1
                    {{filters:p}}
                `, limit: 1 }} format="currency" comparisonMode="previous_period">
              <Card frame={ui.cardFrame || undefined} style={ui.queryCard}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <p style={{ ...ui.eyebrow, margin: 0, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Eficiência</p>
                  <h2 style={{ ...ui.title, margin: 0, fontSize: 20, fontWeight: 600, letterSpacing: '-0.03em' }}>Ticket medio</h2>
                </div>
                <p style={{ ...ui.kpiValue, margin: 0, fontSize: 28, fontWeight: 700, letterSpacing: '-0.04em' }}>{'{{query.valueFormatted}}'}</p>
                <p data-ui="kpi-delta" style={{ ...ui.kpiDelta, margin: 0, fontSize: 13 }}>{'{{query.deltaPercentDisplay}} {{query.comparisonLabel}}'}</p>
              </Card>
            </QueryMarker>

            <QueryMarker dataQuery={{ query: `
                  SELECT COUNT(DISTINCT p.canal_venda_id)::float AS value
                  FROM vendas.pedidos p
                  WHERE 1=1
                    {{filters:p}}
                `, limit: 1 }} format="number" comparisonMode="previous_period">
              <Card frame={ui.cardFrame || undefined} style={ui.queryCard}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <p style={{ ...ui.eyebrow, margin: 0, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Cobertura</p>
                  <h2 style={{ ...ui.title, margin: 0, fontSize: 20, fontWeight: 600, letterSpacing: '-0.03em' }}>Canais ativos</h2>
                </div>
                <p style={{ ...ui.kpiValue, margin: 0, fontSize: 28, fontWeight: 700, letterSpacing: '-0.04em' }}>{'{{query.valueFormatted}}'}</p>
                <p data-ui="kpi-delta" style={{ ...ui.kpiDelta, margin: 0, fontSize: 13 }}>{'{{query.deltaPercentDisplay}} {{query.comparisonLabel}}'}</p>
              </Card>
            </QueryMarker>

            <QueryMarker dataQuery={{ query: `
                  SELECT COALESCE(AVG(CASE WHEN COALESCE(p.status, '') = 'aprovado' THEN 1 ELSE 0 END), 0)::float AS value
                  FROM vendas.pedidos p
                  WHERE 1=1
                    {{filters:p}}
                `, limit: 1 }} format="percent" comparisonMode="previous_period">
              <Card frame={ui.cardFrame || undefined} style={ui.queryCard}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <p style={{ ...ui.eyebrow, margin: 0, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Qualidade</p>
                  <h2 style={{ ...ui.title, margin: 0, fontSize: 20, fontWeight: 600, letterSpacing: '-0.03em' }}>Aprovacao</h2>
                </div>
                <p style={{ ...ui.kpiValue, margin: 0, fontSize: 28, fontWeight: 700, letterSpacing: '-0.04em' }}>{'{{query.valueFormatted}}'}</p>
                <p data-ui="kpi-delta" style={{ ...ui.kpiDelta, margin: 0, fontSize: 13 }}>{'{{query.deltaPercentDisplay}} {{query.comparisonLabel}}'}</p>
              </Card>
            </QueryMarker>
          </section>

          <section style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 18 }}>
            <Card frame={ui.cardFrame || undefined} style={ui.panelCardAlt}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <h2 style={{ ...ui.title, margin: 0, fontSize: 20, fontWeight: 600, letterSpacing: '-0.03em' }}>Aceleracao recente</h2>
                <p style={{ ...ui.paragraph, margin: 0, fontSize: 13, lineHeight: 1.6 }}>Leituras sobre os vetores que estao puxando o crescimento do periodo.</p>
              </div>
              <InsightsMarker
                textStyle={{ ...ui.paragraph, margin: 0, fontSize: 13, lineHeight: 1.65 }}
                iconStyle={{ color: '#2563EB' }}
                items={[
                  { title: 'Receita acima da media recente', text: 'Receita ganhou tracao nos canais proprios e manteve crescimento acima da media recente.' },
                  { title: 'Volume mais regular no periodo', text: 'O volume diario segue acima da media das ultimas semanas, com melhor distribuicao ao longo do periodo.' },
                  { title: 'Melhor retorno sem mais desconto', text: 'Os canais com melhor retorno continuam puxando o resultado total sem depender de descontos mais agressivos.' },
                ]}
              />
            </Card>
            <Card frame={ui.cardFrame || undefined} style={ui.panelCardAlt}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <h2 style={{ ...ui.title, margin: 0, fontSize: 20, fontWeight: 600, letterSpacing: '-0.03em' }}>Concentracao de receita</h2>
                <p style={{ ...ui.paragraph, margin: 0, fontSize: 13, lineHeight: 1.6 }}>Pontos de atencao sobre dependencia de canais e distribuicao do faturamento.</p>
              </div>
              <InsightsMarker
                textStyle={{ ...ui.paragraph, margin: 0, fontSize: 13, lineHeight: 1.65 }}
                iconStyle={{ color: '#F59E0B' }}
                items={[
                  { text: 'O mix segue concentrado em poucos canais, o que aumenta dependencia operacional.' },
                  { text: 'Uma variacao pequena nos principais canais ainda tem impacto relevante na receita consolidada.' },
                  { text: 'A pulverizacao do faturamento continua baixa, o que reduz margem de seguranca para os proximos ciclos.' },
                ]}
              />
            </Card>
            <Card frame={ui.cardFrame || undefined} style={ui.panelCardAlt}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <h2 style={{ ...ui.title, margin: 0, fontSize: 20, fontWeight: 600, letterSpacing: '-0.03em' }}>Conversao e qualidade</h2>
                <p style={{ ...ui.paragraph, margin: 0, fontSize: 13, lineHeight: 1.6 }}>Sinais de eficiencia comercial sem pressao adicional sobre o ticket medio.</p>
              </div>
              <InsightsMarker
                textStyle={{ ...ui.paragraph, margin: 0, fontSize: 13, lineHeight: 1.65 }}
                iconStyle={{ color: '#10B981' }}
                items={[
                  { text: 'A aprovacao continua estavel, com espaco para melhorar conversao sem pressionar o ticket medio.' },
                  { text: 'Existe espaco para elevar a taxa final com ajustes pontuais no topo do funil comercial.' },
                  { text: 'O ticket medio nao mostra deterioracao, o que permite buscar ganho de eficiencia sem comprometer valor.' },
                ]}
              />
            </Card>
          </section>

          <section style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 18 }}>
            <Card frame={ui.cardFrame || undefined} style={ui.panelCard}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <p style={{ ...ui.eyebrow, margin: 0, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Receita por canal</p>
                <h2 style={{ ...ui.title, margin: 0, fontSize: 22, fontWeight: 600, letterSpacing: '-0.03em' }}>Mix comercial</h2>
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
                colors={['#2563EB', '#60A5FA', '#93C5FD', '#BFDBFE']}
                xAxis={{ labelMode: 'first-word' }}
                yAxis={{ width: 72 }}
              />
            </Card>

            <Card frame={ui.cardFrame || undefined} style={ui.panelCardAlt}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <p style={{ ...ui.eyebrow, margin: 0, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Participacao</p>
                <h2 style={{ ...ui.title, margin: 0, fontSize: 22, fontWeight: 600, letterSpacing: '-0.03em' }}>Share por canal</h2>
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
                colors={['#2563EB', '#0F766E', '#EA580C', '#7C3AED', '#DC2626']}
                legend={{ enabled: true, position: 'right' }}
                series={{ innerRadius: 56, outerRadius: 96, showLabels: false }}
              />
            </Card>
          </section>

          <section style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 18 }}>
            <Card frame={ui.cardFrame || undefined} style={{ ...ui.panelCard, minHeight: '100%' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <p style={{ ...ui.eyebrow, margin: 0, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Tendencia diaria</p>
                <h2 style={{ ...ui.title, margin: 0, fontSize: 22, fontWeight: 600, letterSpacing: '-0.03em' }}>Receita ao longo do periodo</h2>
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
                  colors={['#2563EB', '#60A5FA', '#93C5FD']}
                  yAxis={{ width: 72 }}
                  series={{ showDots: false, singleSeriesGradient: true }}
                />
              </div>
            </Card>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, minWidth: 0 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <p style={{ ...ui.eyebrow, margin: 0, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Detalhamento</p>
                <h2 style={{ ...ui.title, margin: 0, fontSize: 22, fontWeight: 600, letterSpacing: '-0.03em' }}>Pedidos filtrados</h2>
              </div>
              <TableMarker
                bordered
                rounded
                radius={12}
                stickyHeader
                striped={false}
                borderColor={ui.tableBorderColor}
                rowHoverColor={ui.tableRowHoverColor}
                headerStyle={ui.tableHeaderStyle}
                rowStyle={ui.tableRowStyle}
                cellStyle={ui.tableCellStyle}
                footerStyle={ui.tableFooterStyle}
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
            </div>
          </section>

          <section style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 18 }}>
            <Card frame={ui.cardFrame || undefined} style={ui.panelCard}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <p style={{ ...ui.eyebrow, margin: 0, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status mix</p>
                <h2 style={{ ...ui.title, margin: 0, fontSize: 22, fontWeight: 600, letterSpacing: '-0.03em' }}>Volume por status</h2>
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
                colors={['#2563EB', '#60A5FA', '#93C5FD', '#BFDBFE']}
              />
            </Card>

            <Card frame={ui.cardFrame || undefined} data-ui="pivot-card" style={ui.panelCardAlt}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <p style={{ ...ui.eyebrow, margin: 0, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Cruzamento</p>
                <h2 style={{ ...ui.title, margin: 0, fontSize: 22, fontWeight: 600, letterSpacing: '-0.03em' }}>Receita por canal e status</h2>
              </div>
              <PivotTableMarker
                bordered
                rounded
                stickyHeader
                borderColor={ui.tableBorderColor}
                containerStyle={ui.pivotContainerStyle}
                headerStyle={ui.pivotHeaderStyle}
                headerTotalStyle={ui.pivotHeaderTotalStyle}
                rowLabelStyle={ui.pivotRowLabelStyle}
                cellStyle={ui.pivotCellStyle}
                rowTotalStyle={ui.pivotRowTotalStyle}
                footerStyle={ui.pivotFooterStyle}
                emptyStateStyle={ui.pivotEmptyStateStyle}
                expandButtonStyle={ui.pivotExpandButtonStyle}
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
  const variants = DASHBOARD_VARIANTS.map((variant) => ({
    content: buildDashboardTemplateSource(variant, themeName),
    name: variant.fileName,
    path: variant.path,
  }))

  variants.push({
    content: buildClassicDashboardTemplateSource(themeName),
    name: CLASSIC_DASHBOARD_VARIANT.fileName,
    path: CLASSIC_DASHBOARD_VARIANT.path,
  })

  variants.push(buildComprasDashboardTemplateVariant(themeName))
  variants.push(buildFinanceiroDashboardTemplateVariant(themeName))
  variants.push(buildMetaAdsDashboardTemplateVariant(themeName))
  variants.push(buildGoogleAdsDashboardTemplateVariant(themeName))
  variants.push(buildShopifyDashboardTemplateVariant(themeName))

  return variants
}
