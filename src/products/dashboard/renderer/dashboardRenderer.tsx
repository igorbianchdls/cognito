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
import DashboardDatePicker from '@/products/dashboard/render/components/DashboardDatePicker'
import DashboardInsights from '@/products/dashboard/render/components/DashboardInsights'
import DashboardQuery, {
  getDashboardQueryDeltaColor,
  resolveDashboardQueryTemplate,
  useDashboardQueryResult,
} from '@/products/dashboard/render/components/DashboardQuery'
import DashboardText from '@/products/dashboard/render/components/DashboardText'
import {
  DASHBOARD_DEFAULT_CHART_PALETTE,
  DASHBOARD_SUPPORTED_HTML_TAG_SET,
  normalizeDashboardChartType,
  resolveDashboardChartPaletteColors,
} from '@/products/dashboard/contract/dashboardContract'
import { resolveDashboardTemplateThemeTokens } from '@/products/dashboard/templates/dashboardTemplateThemes'

type AnyRecord = Record<string, any>
type DashboardRenderComponent = React.FC<{
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

function getNodeKey(node: any, fallbackIndex: number, path: number[]): string {
  const type = String(node?.type || 'node')
  const props = node?.props && typeof node.props === 'object' ? node.props : {}
  const explicitId =
    typeof props.id === 'string' && props.id.trim()
      ? props.id.trim()
      : typeof props.key === 'string' && props.key.trim()
        ? props.key.trim()
        : ''
  if (explicitId) return `${type}:${explicitId}`
  return `${type}:${path.join('.')}:${fallbackIndex}`
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
  headerTheme,
  managers,
  children,
}: {
  themeName?: string
  chartPaletteName?: string
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
  const themeTokens = resolveDashboardTemplateThemeTokens(name || 'light')
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
  if (containerFrameVariant) cssVars.containerFrameVariant = containerFrameVariant
  if (containerFrameCornerSize) cssVars.containerFrameCornerSize = containerFrameCornerSize
  if (containerFrameCornerWidth) cssVars.containerFrameCornerWidth = containerFrameCornerWidth

  return (
    <ThemeProvider name={name} cssVars={cssVars}>
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

function resolveComponent(type: string): DashboardRenderComponent | undefined {
  if (type === 'DashboardTemplate') return ({ children }) => <DashboardRoot>{children}</DashboardRoot>
  if (type === 'Theme') return ({ element, children }) => <DashboardTheme element={element}>{children}</DashboardTheme>
  if (type === 'Dashboard') return ({ element, children }) => <DashboardSurface element={element}>{children}</DashboardSurface>
  if (type === 'Card') return ({ element, children }) => <JsxCardSurface element={element}>{children}</JsxCardSurface>
  if (type === 'Tabs') return ({ element, children }) => <DashboardTabs element={element}>{children}</DashboardTabs>
  if (type === 'Tab') return ({ element, children }) => <DashboardTab element={element}>{children}</DashboardTab>
  if (type === 'TabPanel') return ({ element, children }) => <DashboardTabPanel element={element}>{children}</DashboardTabPanel>
  if (type === 'Chart') return ({ element, onAction }) => <DashboardChart element={element} onAction={onAction} />
  if (type === 'BarChart') return ({ element, onAction }) => <>{renderChartByType('bar', element, onAction)}</>
  if (type === 'LineChart') return ({ element, onAction }) => <>{renderChartByType('line', element, onAction)}</>
  if (type === 'PieChart') return ({ element, onAction }) => <>{renderChartByType('pie', element, onAction)}</>
  if (type === 'HorizontalBarChart') return ({ element, onAction }) => <>{renderChartByType('horizontal-bar', element, onAction)}</>
  if (type === 'ScatterChart') return ({ element, onAction }) => <>{renderChartByType('scatter', element, onAction)}</>
  if (type === 'RadarChart') return ({ element, onAction }) => <>{renderChartByType('radar', element, onAction)}</>
  if (type === 'TreemapChart') return ({ element, onAction }) => <>{renderChartByType('treemap', element, onAction)}</>
  if (type === 'ComposedChart') return ({ element, onAction }) => <>{renderChartByType('composed', element, onAction)}</>
  if (type === 'FunnelChart') return ({ element, onAction }) => <>{renderChartByType('funnel', element, onAction)}</>
  if (type === 'SankeyChart') return ({ element, onAction }) => <>{renderChartByType('sankey', element, onAction)}</>
  if (type === 'Gauge') return ({ element, onAction }) => <>{renderChartByType('gauge', element, onAction)}</>
  if (type === 'KPI') return ({ element, onAction }) => <biRegistry.KPI element={element} onAction={onAction} />
  if (type === 'Query') return ({ element, children }) => <DashboardQuery element={element}>{children}</DashboardQuery>
  if (type === 'Table') return ({ element, onAction }) => <biRegistry.Table element={element} onAction={onAction} />
  if (type === 'PivotTable') return ({ element, onAction }) => <biRegistry.PivotTable element={element} onAction={onAction} />
  if (type === 'Filter') return ({ element, onAction }) => <biRegistry.Filter element={element} onAction={onAction} />
  if (type === 'Select') return () => null
  if (type === 'OptionList') return () => null
  if (type === 'DatePicker') return ({ element, onAction }) => <DashboardDatePicker element={element} onAction={onAction} />
  if (type === 'Insights') return ({ element }) => <DashboardInsights element={element} />
  if (type === 'Text') return ({ element, children }) => <DashboardText element={element}>{children}</DashboardText>
  if (type === 'TextNode') {
    return ({ element }) => {
      const queryResult = useDashboardQueryResult()
      return <>{resolveDashboardQueryTemplate(String((element?.props?.text as string | undefined) || ''), queryResult)}</>
    }
  }
  if (type === 'Br') return () => <br />
  if (DASHBOARD_SUPPORTED_HTML_TAG_SET.has(type.toLowerCase())) {
    return ({ element, children }) => (
      <HtmlNode tag={type.toLowerCase() as keyof React.JSX.IntrinsicElements} element={element}>
        {children}
      </HtmlNode>
    )
  }
  return undefined
}

function RenderDashboardNode({
  node,
  data,
  onAction,
  path,
}: {
  node: any
  data?: AnyRecord
  onAction?: (action: any) => void
  path: number[]
}) {
  const queryResult = useDashboardQueryResult()
  if (node == null) return null
  if (typeof node === 'string' || typeof node === 'number') return <>{resolveDashboardQueryTemplate(String(node), queryResult)}</>
  if (typeof node !== 'object') return null

  const type = String(node.type || '').trim()
  const Component = resolveComponent(type)
  if (!Component) {
    return (
      <div className="rounded border border-yellow-300 bg-yellow-50 p-2 text-xs text-yellow-800">
        Unknown component: {type || 'node'}
      </div>
    )
  }

  const children = Array.isArray(node.children)
    ? node.children.map((child: any, index: number) => (
        <RenderDashboardNode
          key={getNodeKey(child, index, [...path, index])}
          node={child}
          data={data}
          onAction={onAction}
          path={[...path, index]}
        />
      ))
    : null

  return (
    <Component element={node} data={data} onAction={onAction}>
      {children}
    </Component>
  )
}

export function DashboardRenderer({
  tree,
  data,
  onAction,
}: {
  tree: any
  data?: AnyRecord
  onAction?: (action: any) => void
}) {
  if (Array.isArray(tree)) {
    return (
      <>
        {tree.map((node, index) => (
          <RenderDashboardNode key={getNodeKey(node, index, [index])} node={node} data={data} onAction={onAction} path={[index]} />
        ))}
      </>
    )
  }

  return <RenderDashboardNode node={tree} data={data} onAction={onAction} path={[]} />
}
