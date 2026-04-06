'use client'

import React from 'react'

import JsonRenderBarChart from '@/products/bi/json-render/components/BarChart'
import JsxCardSurface, {
  getJsxCardSurfaceStyle,
  isCardLikeSurface,
} from '@/products/bi/json-render/components/JsxCardSurface'
import JsonRenderLineChart from '@/products/bi/json-render/components/LineChart'
import JsonRenderPieChart from '@/products/bi/json-render/components/PieChart'
import { registry as biRegistry } from '@/products/bi/json-render/registry'
import { mapManagersToCssVars } from '@/products/bi/json-render/theme/thememanagers'
import { buildThemeVars } from '@/products/bi/json-render/theme/themeAdapter'
import { ThemeProvider, useSemanticUiStyle } from '@/products/bi/json-render/theme/ThemeContext'
import { resolveDashboardBorderRadiusPreset } from '@/products/artifacts/dashboard/borderPresets'
import DashboardDatePicker from '@/products/artifacts/dashboard/renderer/components/DashboardDatePicker'
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
  DASHBOARD_DEFAULT_CHART_PALETTE,
  DASHBOARD_SUPPORTED_HTML_TAG_SET,
  normalizeDashboardChartType,
  resolveDashboardChartPaletteColors,
} from '@/products/artifacts/dashboard/contract/dashboardContract'
import { resolveDashboardTemplateThemeTokens } from '@/products/artifacts/dashboard/templates/dashboardTemplateThemes'

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

function renderChartByType(chartType: unknown, element: any, onAction?: (action: any) => void) {
  const normalized = normalizeDashboardChartType(chartType)
  if (normalized === 'bar') return <JsonRenderBarChart element={element} />
  if (normalized === 'line') return <JsonRenderLineChart element={element} />
  if (normalized === 'pie') return <JsonRenderPieChart element={element} />
  if (normalized === 'horizontal-bar') return <biRegistry.HorizontalBarChart element={element} onAction={onAction} />
  if (normalized === 'scatter') return <biRegistry.ScatterChart element={element} onAction={onAction} />
  if (normalized === 'radar') return <biRegistry.RadarChart element={element} onAction={onAction} />
  if (normalized === 'treemap') return <biRegistry.TreemapChart element={element} onAction={onAction} />
  if (normalized === 'composed') return <biRegistry.ComposedChart element={element} onAction={onAction} />
  if (normalized === 'funnel') return <biRegistry.FunnelChart element={element} onAction={onAction} />
  if (normalized === 'sankey') return <biRegistry.SankeyChart element={element} onAction={onAction} />
  if (normalized === 'gauge') return <biRegistry.Gauge element={element} onAction={onAction} />

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
  themeName,
  chartPaletteName,
  borderPreset,
  headerTheme,
  managers,
  children,
}: {
  themeName?: string
  chartPaletteName?: string
  borderPreset?: string
  headerTheme?: string
  managers?: AnyRecord
  children?: React.ReactNode
}) {
  const name = themeName
  const chartPalette =
    typeof chartPaletteName === 'string' && chartPaletteName.trim()
      ? String(chartPaletteName).trim().toLowerCase()
      : DASHBOARD_DEFAULT_CHART_PALETTE
  const preset = buildThemeVars(name, (managers || {}) as any, { headerTheme })
  const themeTokens = resolveDashboardTemplateThemeTokens(name || 'light', borderPreset)
  const baseCssVars = preset.cssVars || mapManagersToCssVars((managers || {}) as any)
  const cssVars: Record<string, string> = {
    ...baseCssVars,
    chartColorScheme: JSON.stringify(resolveDashboardChartPaletteColors(chartPalette)),
  }
  const containerFrameVariant = baseCssVars.containerFrameVariant || themeTokens.cardFrame?.variant
  const containerFrameCornerSize =
    baseCssVars.containerFrameCornerSize || (themeTokens.cardFrame ? String(themeTokens.cardFrame.cornerSize) : undefined)
  const containerFrameCornerWidth =
    baseCssVars.containerFrameCornerWidth || (themeTokens.cardFrame ? String(themeTokens.cardFrame.cornerWidth) : undefined)
  const containerRadius = resolveDashboardBorderRadiusPreset(borderPreset, themeTokens.cardFrame ? 0 : 24)
  if (containerFrameVariant) cssVars.containerFrameVariant = containerFrameVariant
  if (containerFrameCornerSize) cssVars.containerFrameCornerSize = containerFrameCornerSize
  if (containerFrameCornerWidth) cssVars.containerFrameCornerWidth = containerFrameCornerWidth
  cssVars.containerRadius = String(containerRadius)
  const components = {
    Card: {
      backgroundColor: 'var(--surfaceBg)',
      borderColor: 'var(--surfaceBorder)',
      borderWidth: 1,
      borderRadius: 'var(--containerRadius)',
      padding: 22,
    },
    KpiCard: {
      backgroundColor: 'var(--kpiCardBg, var(--surfaceBg))',
      borderColor: 'var(--kpiCardBorder, var(--surfaceBorder))',
      padding: 22,
    },
    ChartCard: {
      backgroundColor: 'var(--chartCardBg, var(--surfaceBg))',
      borderColor: 'var(--chartCardBorder, var(--surfaceBorder))',
      padding: 22,
    },
    TableCard: {
      backgroundColor: 'var(--tableCardBg, var(--surfaceBg))',
      borderColor: 'var(--tableCardBorder, var(--surfaceBorder))',
      padding: 22,
    },
    PivotCard: {
      backgroundColor: 'var(--pivotCardBg, var(--surfaceBg))',
      borderColor: 'var(--pivotCardBorder, var(--surfaceBorder))',
      padding: 22,
    },
    FilterCard: {
      backgroundColor: 'var(--filterCardBg, var(--surfaceBg))',
      borderColor: 'var(--filterCardBorder, var(--surfaceBorder))',
      padding: 22,
    },
    NoteCard: {
      backgroundColor: 'var(--noteCardBg, var(--surfaceBg))',
      borderColor: 'var(--noteCardBorder, var(--surfaceBorder))',
      padding: 22,
    },
  } as const

  return (
    <ThemeProvider name={name} cssVars={cssVars} components={components}>
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
    </ThemeProvider>
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
  Table: ({ element, onAction }) => <biRegistry.Table element={element} onAction={onAction} />,
  PivotTable: ({ element, onAction }) => <biRegistry.PivotTable element={element} onAction={onAction} />,
  Filter: ({ element, onAction }) => <biRegistry.Filter element={element} onAction={onAction} />,
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
