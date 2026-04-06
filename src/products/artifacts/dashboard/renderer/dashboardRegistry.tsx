'use client'

import React from 'react'

import JsonRenderBarChart from '@/products/bi/json-render/components/BarChart'
import JsonRenderComposedChart from '@/products/bi/json-render/components/ComposedChart'
import JsonRenderFunnelChart from '@/products/bi/json-render/components/FunnelChart'
import JsonRenderGauge from '@/products/bi/json-render/components/Gauge'
import JsonRenderHorizontalBarChart from '@/products/bi/json-render/components/HorizontalBarChart'
import JsxCardSurface, {
  getJsxCardSurfaceStyle,
  isCardLikeSurface,
} from '@/products/bi/json-render/components/JsxCardSurface'
import JsonRenderLineChart from '@/products/bi/json-render/components/LineChart'
import JsonRenderPieChart from '@/products/bi/json-render/components/PieChart'
import JsonRenderPivotTable from '@/products/bi/json-render/components/PivotTable'
import JsonRenderRadarChart from '@/products/bi/json-render/components/RadarChart'
import JsonRenderSankeyChart from '@/products/bi/json-render/components/SankeyChart'
import JsonRenderScatterChart from '@/products/bi/json-render/components/ScatterChart'
import JsonRenderTable from '@/products/bi/json-render/components/Table'
import JsonRenderTreemapChart from '@/products/bi/json-render/components/TreemapChart'
import { useSemanticUiStyle, useThemeOverrides } from '@/products/bi/json-render/theme/ThemeContext'
import DashboardDatePicker from '@/products/artifacts/dashboard/renderer/components/DashboardDatePicker'
import DashboardFilter from '@/products/artifacts/dashboard/renderer/components/DashboardFilter'
import DashboardInsights from '@/products/artifacts/dashboard/renderer/components/DashboardInsights'
import DashboardKpi from '@/products/artifacts/dashboard/renderer/components/DashboardKpi'
import { DashboardGrid, DashboardHorizontal, DashboardPanel, DashboardVertical } from '@/products/artifacts/dashboard/renderer/components/DashboardLayout'
import DashboardQuery, {
  getDashboardQueryDeltaColor,
  resolveDashboardQueryTemplate,
  useDashboardQueryResult,
} from '@/products/artifacts/dashboard/renderer/components/DashboardQuery'
import DashboardText from '@/products/artifacts/dashboard/renderer/components/DashboardText'
import {
  DASHBOARD_SUPPORTED_HTML_TAG_SET,
  normalizeDashboardChartType,
} from '@/products/artifacts/dashboard/contract/dashboardContract'
import { deepMerge } from '@/stores/ui/json-render/utils'

type AnyRecord = Record<string, any>

export type DashboardRenderComponent = React.FC<{
  element: any
  children?: React.ReactNode
  data?: AnyRecord
  onAction?: (action: any) => void
}>

type TabsContextValue = {
  activeValue: string
  setActiveValue: (value: string) => void
}

const TabsContext = React.createContext<TabsContextValue | null>(null)

const defaultGauge = {
  format: 'number' as 'currency' | 'percent' | 'number',
  width: 220,
  height: 130,
  thickness: 16,
  trackColor: '#e5e7eb',
  valueColor: '#2563eb',
  targetColor: '#0f172a',
  roundedCaps: true,
  showValue: true,
  showMinMax: true,
  showTarget: true,
  startAngle: -110,
  endAngle: 110,
} as const

const defaultBarChart = {
  height: 220,
  format: 'number' as 'currency' | 'percent' | 'number',
  titleStyle: { padding: 8, textAlign: 'left' },
  nivo: {
    layout: 'vertical',
    padding: 0.3,
    groupMode: 'grouped',
    gridX: false,
    gridY: false,
    axisBottom: { tickRotation: 0, legendOffset: 32 },
    axisLeft: { legendOffset: 40 },
    margin: { top: 10, right: 10, bottom: 40, left: 48 },
    animate: true,
    motionConfig: 'gentle',
  },
} as const

const defaultScatterChart = {
  height: 260,
  format: 'number' as 'currency' | 'percent' | 'number',
  titleStyle: { padding: 6, textAlign: 'left' },
  colorScheme: ['#3b82f6', '#10b981', '#f59e0b'],
  nivo: { range: [60, 360], animate: true },
} as const

const defaultRadarChart = {
  height: 260,
  format: 'number' as 'currency' | 'percent' | 'number',
  titleStyle: { padding: 6, textAlign: 'left' },
  colorScheme: ['#3b82f6', '#10b981', '#f59e0b'],
  nivo: { outerRadius: '72%', fillOpacity: 0.28, animate: true },
} as const

const defaultTreemapChart = {
  height: 280,
  format: 'number' as 'currency' | 'percent' | 'number',
  titleStyle: { padding: 6, textAlign: 'left' },
  colorScheme: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'],
  nivo: { aspectRatio: 4 / 3, animate: true },
} as const

const defaultComposedChart = {
  height: 280,
  format: 'number' as 'currency' | 'percent' | 'number',
  titleStyle: { padding: 6, textAlign: 'left' },
  colorScheme: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'],
  nivo: { gridX: false, gridY: true, curve: 'monotone', animate: true },
} as const

const defaultFunnelChart = {
  height: 300,
  format: 'number' as 'currency' | 'percent' | 'number',
  titleStyle: { padding: 6, textAlign: 'left' },
  colorScheme: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'],
  nivo: { animate: true },
} as const

const defaultSankeyChart = {
  height: 360,
  format: 'number' as 'currency' | 'percent' | 'number',
  titleStyle: { padding: 6, textAlign: 'left' },
  colorScheme: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'],
  nivo: { nodePadding: 14, nodeWidth: 14, linkCurvature: 0.5, iterations: 32, sort: true, animate: true },
} as const

const defaultTable = {
  pageSize: 10,
  showPagination: true,
  showColumnToggle: true,
  enableSearch: true,
  stickyHeader: true,
  bordered: true,
  rounded: true,
  density: 'comfortable' as 'compact' | 'comfortable' | 'spacious',
  striped: false,
  editableMode: false,
  editableCells: 'none',
  editableRowActions: {
    allowAdd: false,
    allowDelete: false,
    allowDuplicate: false,
  },
  containerStyle: { borderColor: '#e5e7eb', borderWidth: 1, borderStyle: 'solid', borderRadius: 8, padding: 12 },
  borderless: false,
} as const

const defaultPivotTable = {
  stickyHeader: true,
  bordered: true,
  rounded: true,
  density: 'comfortable' as 'compact' | 'comfortable' | 'spacious',
  showSubtotals: true,
  showGrandTotals: true,
  defaultExpandedLevels: 1,
  enableExportCsv: false,
  containerStyle: { borderColor: '#e5e7eb', borderWidth: 1, borderStyle: 'solid', borderRadius: 8 },
} as const

function useMergedElementProps(
  element: any,
  defaults: AnyRecord,
  componentName: string,
): { props: AnyRecord } {
  const theme = useThemeOverrides()
  const themeComponent = ((theme.components as AnyRecord | undefined)?.[componentName] || {}) as AnyRecord
  return {
    props: deepMerge(deepMerge(defaults, themeComponent), (element?.props || {}) as AnyRecord),
  }
}

function DashboardHorizontalBarChart({ element }: { element: any }) {
  return <JsonRenderHorizontalBarChart element={useMergedElementProps(element, defaultBarChart as AnyRecord, 'HorizontalBarChart')} />
}

function DashboardScatterChart({ element }: { element: any }) {
  return <JsonRenderScatterChart element={useMergedElementProps(element, defaultScatterChart as AnyRecord, 'ScatterChart')} />
}

function DashboardRadarChart({ element }: { element: any }) {
  return <JsonRenderRadarChart element={useMergedElementProps(element, defaultRadarChart as AnyRecord, 'RadarChart')} />
}

function DashboardTreemapChart({ element }: { element: any }) {
  return <JsonRenderTreemapChart element={useMergedElementProps(element, defaultTreemapChart as AnyRecord, 'TreemapChart')} />
}

function DashboardComposedChart({ element }: { element: any }) {
  return <JsonRenderComposedChart element={useMergedElementProps(element, defaultComposedChart as AnyRecord, 'ComposedChart')} />
}

function DashboardFunnelChart({ element }: { element: any }) {
  return <JsonRenderFunnelChart element={useMergedElementProps(element, defaultFunnelChart as AnyRecord, 'FunnelChart')} />
}

function DashboardSankeyChart({ element }: { element: any }) {
  return <JsonRenderSankeyChart element={useMergedElementProps(element, defaultSankeyChart as AnyRecord, 'SankeyChart')} />
}

function DashboardGauge({ element }: { element: any }) {
  return <JsonRenderGauge element={useMergedElementProps(element, defaultGauge as AnyRecord, 'Gauge')} />
}

function DashboardTable({ element }: { element: any }) {
  return <JsonRenderTable element={{ props: deepMerge(defaultTable as AnyRecord, (element?.props || {}) as AnyRecord) }} />
}

function DashboardPivotTable({ element }: { element: any }) {
  return <JsonRenderPivotTable element={useMergedElementProps(element, defaultPivotTable as AnyRecord, 'PivotTable')} />
}

function renderChartByType(chartType: unknown, element: any, onAction?: (action: any) => void) {
  const normalized = normalizeDashboardChartType(chartType)
  if (normalized === 'bar') return <JsonRenderBarChart element={element} />
  if (normalized === 'line') return <JsonRenderLineChart element={element} />
  if (normalized === 'pie') return <JsonRenderPieChart element={element} />
  if (normalized === 'horizontal-bar') return <DashboardHorizontalBarChart element={element} />
  if (normalized === 'scatter') return <DashboardScatterChart element={element} />
  if (normalized === 'radar') return <DashboardRadarChart element={element} />
  if (normalized === 'treemap') return <DashboardTreemapChart element={element} />
  if (normalized === 'composed') return <DashboardComposedChart element={element} />
  if (normalized === 'funnel') return <DashboardFunnelChart element={element} />
  if (normalized === 'sankey') return <DashboardSankeyChart element={element} />
  if (normalized === 'gauge') return <DashboardGauge element={element} />

  return (
    <div className="rounded border border-yellow-300 bg-yellow-50 p-2 text-xs text-yellow-800">
      Unsupported chart type: {normalized || 'unknown'}
    </div>
  )
}

function DashboardChart({
  element,
  onAction,
}: {
  element: any
  onAction?: (action: any) => void
}) {
  return renderChartByType((element?.props || {}).type, element, onAction)
}

function normalizeProps(input: Record<string, any> | undefined): Record<string, any> {
  const props = { ...(input || {}) }
  delete props.style
  delete props.text
  delete props.title
  delete props.children
  return props
}

function DashboardRoot({ children }: { children?: React.ReactNode }) {
  return <>{children}</>
}

function renderDashboardThemeLayer({
  themeName: _themeName,
  chartPaletteName: _chartPaletteName,
  borderPreset: _borderPreset,
  headerTheme: _headerTheme,
  managers: _managers,
  children,
}: {
  themeName?: string
  chartPaletteName?: string
  borderPreset?: string
  headerTheme?: string
  managers?: AnyRecord
  children?: React.ReactNode
}) {
  return (
    <div
      style={{
        width: '100%',
        minHeight: '100%',
        display: 'flex',
        flexDirection: 'column',
        minWidth: 0,
      }}
    >
      {children}
    </div>
  )
}

function DashboardTheme({ element, children }: { element: any; children?: React.ReactNode }) {
  const props = (element?.props || {}) as AnyRecord
  return renderDashboardThemeLayer({
    themeName: typeof props.name === 'string' ? props.name : undefined,
    chartPaletteName: typeof props.chartPalette === 'string' ? props.chartPalette : undefined,
    borderPreset: typeof props.borderPreset === 'string' ? props.borderPreset : undefined,
    headerTheme: typeof props.headerTheme === 'string' ? props.headerTheme : undefined,
    managers: (props.managers || {}) as AnyRecord,
    children,
  })
}

function DashboardSurface({ element, children }: { element: any; children?: React.ReactNode }) {
  const props = (element?.props || {}) as AnyRecord
  const content = (
    <div
      style={{
        width: '100%',
        minHeight: '100%',
        display: 'flex',
        flexDirection: 'column',
        minWidth: 0,
        boxSizing: 'border-box',
      }}
    >
      {children}
    </div>
  )

  if (typeof props.theme === 'string' && props.theme.trim()) {
    return renderDashboardThemeLayer({
      themeName: props.theme,
      chartPaletteName: typeof props.chartPalette === 'string' ? props.chartPalette : undefined,
      borderPreset: typeof props.borderPreset === 'string' ? props.borderPreset : undefined,
      headerTheme: typeof props.headerTheme === 'string' ? props.headerTheme : undefined,
      managers: (props.managers || {}) as AnyRecord,
      children: content,
    })
  }

  return content
}

function HtmlNode({
  tag,
  element,
  children,
}: {
  tag: keyof React.JSX.IntrinsicElements
  element: any
  children?: React.ReactNode
}) {
  const props = (element?.props || {}) as Record<string, any>
  const queryResult = useDashboardQueryResult()
  const semanticStyle = useSemanticUiStyle(props['data-ui'], tag, {
    active: props['data-active'] === true || props['data-active'] === 'true' || props['aria-selected'] === true || props['aria-selected'] === 'true',
  })
  const queryDeltaColor = props['data-ui'] === 'kpi-delta' ? getDashboardQueryDeltaColor(queryResult) : undefined
  const fallbackContent =
    typeof props.text === 'string'
      ? resolveDashboardQueryTemplate(props.text, queryResult)
      : typeof props.title === 'string'
        ? resolveDashboardQueryTemplate(props.title, queryResult)
        : null
  const content = children ?? fallbackContent

  if (isCardLikeSurface(props)) {
    return (
      <JsxCardSurface
        element={{
          ...element,
          props: {
            ...props,
            style: getJsxCardSurfaceStyle(props, semanticStyle),
          },
        }}
      >
        {content}
      </JsxCardSurface>
    )
  }

  return React.createElement(
    tag,
    {
      ...normalizeProps(props),
      style: {
        boxSizing: 'border-box',
        minWidth: 0,
        ...semanticStyle,
        ...(props.style && typeof props.style === 'object' ? props.style : {}),
        ...(queryDeltaColor ? { color: queryDeltaColor } : {}),
      },
    },
    content,
  )
}

function DashboardTabs({
  element,
  children,
}: {
  element: any
  children?: React.ReactNode
}) {
  const defaultValue = typeof element?.props?.defaultValue === 'string' ? element.props.defaultValue : ''
  const [activeValue, setActiveValue] = React.useState(defaultValue)
  const contextValue = React.useMemo(() => ({ activeValue, setActiveValue }), [activeValue])
  return <TabsContext.Provider value={contextValue}>{children}</TabsContext.Provider>
}

function DashboardTab({
  element,
  children,
}: {
  element: any
  children?: React.ReactNode
}) {
  const tabs = React.useContext(TabsContext)
  const props = (element?.props || {}) as Record<string, any>
  const value = typeof props.value === 'string' ? props.value : ''
  const tag = typeof props.as === 'string' ? (props.as as keyof React.JSX.IntrinsicElements) : 'button'
  const active = tabs?.activeValue === value
  const semanticStyle = useSemanticUiStyle('tab', tag, { active })
  const normalizedProps = normalizeProps(props)
  delete normalizedProps.as
  delete normalizedProps.value
  delete normalizedProps.defaultValue
  delete normalizedProps['data-ui']
  delete normalizedProps['data-active']

  return React.createElement(
    tag,
    {
      ...normalizedProps,
      type: tag === 'button' ? 'button' : undefined,
      role: props.role || 'tab',
      'aria-selected': active,
      'data-ui': 'tab',
      'data-active': active ? 'true' : 'false',
      onClick: () => tabs?.setActiveValue(value),
      style: {
        boxSizing: 'border-box',
        minWidth: 0,
        cursor: 'pointer',
        ...semanticStyle,
        ...(props.style && typeof props.style === 'object' ? props.style : {}),
      },
    },
    children ?? props.text ?? null,
  )
}

function DashboardTabPanel({
  element,
  children,
}: {
  element: any
  children?: React.ReactNode
}) {
  const tabs = React.useContext(TabsContext)
  const props = (element?.props || {}) as Record<string, any>
  const value = typeof props.value === 'string' ? props.value : ''
  const forceMount = props.forceMount === true || props.forceMount === 'true'
  const active = tabs?.activeValue === value
  if (!active && !forceMount) return null
  const tag = typeof props.as === 'string' ? (props.as as keyof React.JSX.IntrinsicElements) : 'div'
  const normalizedProps = normalizeProps(props)
  delete normalizedProps.as
  delete normalizedProps.value
  delete normalizedProps.forceMount
  return React.createElement(
    tag,
    {
      ...normalizedProps,
      role: props.role || 'tabpanel',
      hidden: !active,
      'data-ui': props['data-ui'] || 'tab-panel',
      style: {
        boxSizing: 'border-box',
        minWidth: 0,
        ...(props.style && typeof props.style === 'object' ? props.style : {}),
      },
    },
    children,
  )
}

const DashboardTextNode: DashboardRenderComponent = ({ element }) => {
  const queryResult = useDashboardQueryResult()
  return <>{resolveDashboardQueryTemplate(String((element?.props?.text as string | undefined) || ''), queryResult)}</>
}

export const dashboardRegistry: Record<string, DashboardRenderComponent> = {
  DashboardTemplate: ({ children }) => <DashboardRoot>{children}</DashboardRoot>,
  Theme: ({ element, children }) => <DashboardTheme element={element}>{children}</DashboardTheme>,
  Dashboard: ({ element, children }) => <DashboardSurface element={element}>{children}</DashboardSurface>,
  Grid: ({ element, children }) => <DashboardGrid element={element}>{children}</DashboardGrid>,
  Vertical: ({ element, children }) => <DashboardVertical element={element}>{children}</DashboardVertical>,
  Horizontal: ({ element, children }) => <DashboardHorizontal element={element}>{children}</DashboardHorizontal>,
  Panel: ({ element, children }) => <DashboardPanel element={element}>{children}</DashboardPanel>,
  Card: ({ element, children }) => <JsxCardSurface element={element}>{children}</JsxCardSurface>,
  Tabs: ({ element, children }) => <DashboardTabs element={element}>{children}</DashboardTabs>,
  Tab: ({ element, children }) => <DashboardTab element={element}>{children}</DashboardTab>,
  TabPanel: ({ element, children }) => <DashboardTabPanel element={element}>{children}</DashboardTabPanel>,
  Chart: ({ element, onAction }) => <DashboardChart element={element} onAction={onAction} />,
  BarChart: ({ element, onAction }) => <>{renderChartByType('bar', element, onAction)}</>,
  LineChart: ({ element, onAction }) => <>{renderChartByType('line', element, onAction)}</>,
  PieChart: ({ element, onAction }) => <>{renderChartByType('pie', element, onAction)}</>,
  HorizontalBarChart: ({ element, onAction }) => <>{renderChartByType('horizontal-bar', element, onAction)}</>,
  ScatterChart: ({ element, onAction }) => <>{renderChartByType('scatter', element, onAction)}</>,
  RadarChart: ({ element, onAction }) => <>{renderChartByType('radar', element, onAction)}</>,
  TreemapChart: ({ element, onAction }) => <>{renderChartByType('treemap', element, onAction)}</>,
  ComposedChart: ({ element, onAction }) => <>{renderChartByType('composed', element, onAction)}</>,
  FunnelChart: ({ element, onAction }) => <>{renderChartByType('funnel', element, onAction)}</>,
  SankeyChart: ({ element, onAction }) => <>{renderChartByType('sankey', element, onAction)}</>,
  Gauge: ({ element, onAction }) => <>{renderChartByType('gauge', element, onAction)}</>,
  KPI: ({ element }) => <DashboardKpi element={element} />,
  Query: ({ element, children }) => <DashboardQuery element={element}>{children}</DashboardQuery>,
  Table: ({ element }) => <DashboardTable element={element} />,
  PivotTable: ({ element }) => <DashboardPivotTable element={element} />,
  Filter: ({ element, onAction }) => <DashboardFilter element={element} onAction={onAction} />,
  Select: () => null,
  OptionList: () => null,
  DatePicker: ({ element, onAction }) => <DashboardDatePicker element={element} onAction={onAction} />,
  Insights: ({ element }) => <DashboardInsights element={element} />,
  Text: ({ element, children }) => <DashboardText element={element}>{children}</DashboardText>,
  TextNode: DashboardTextNode,
  Br: () => <br />,
}

export function resolveDashboardComponent(type: string): DashboardRenderComponent | undefined {
  const registeredComponent = dashboardRegistry[type]
  if (registeredComponent) return registeredComponent
  if (DASHBOARD_SUPPORTED_HTML_TAG_SET.has(type.toLowerCase())) {
    return ({ element, children }) => (
      <HtmlNode tag={type.toLowerCase() as keyof React.JSX.IntrinsicElements} element={element}>
        {children}
      </HtmlNode>
    )
  }
  return undefined
}
