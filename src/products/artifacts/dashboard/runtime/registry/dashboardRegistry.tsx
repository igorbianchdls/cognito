'use client'

import React from 'react'

import { HeaderEditorModal } from '@/products/artifacts/dashboard/runtime/components/content/HeaderEditorModal'
import { EditableComponentOverlay } from '@/products/artifacts/dashboard/runtime/editing/EditableComponentOverlay'
import {
  DashboardHeaderScopeProvider,
  DashboardThemeSelectionProvider,
  type DashboardAppearanceOverrides,
  resolveDashboardHeaderCardOverride,
  resolveDashboardHeaderTheme,
  resolveDashboardNodeStyle,
  resolveDashboardPageTheme,
  useDashboardThemeSelection,
} from '@/products/artifacts/dashboard/runtime/theme'
import DashboardChart from '@/products/artifacts/dashboard/runtime/components/chart/DashboardChart'
import DashboardCardSurface from '@/products/artifacts/dashboard/runtime/components/layout/DashboardCardSurface'
import DashboardDatePicker from '@/products/artifacts/dashboard/runtime/components/filters/DashboardDatePicker'
import DashboardFilter from '@/products/artifacts/dashboard/runtime/components/filters/DashboardFilter'
import DashboardIcon from '@/products/artifacts/dashboard/runtime/components/content/DashboardIcon'
import DashboardInsights from '@/products/artifacts/dashboard/runtime/components/insights/DashboardInsights'
import DashboardKpi from '@/products/artifacts/dashboard/runtime/components/kpi/DashboardKpi'
import { DashboardKpiCompare } from '@/products/artifacts/dashboard/runtime/components/kpi/DashboardKpiCompare'
import { DashboardGrid, DashboardHorizontal, DashboardPanel, DashboardVertical } from '@/products/artifacts/dashboard/runtime/components/layout/DashboardLayout'
import DashboardPivotTable from '@/products/artifacts/dashboard/runtime/components/table/DashboardPivotTable'
import DashboardQuery, {
  getDashboardQueryDeltaColor,
  resolveDashboardQueryTemplate,
  useDashboardQueryResult,
} from '@/products/artifacts/dashboard/runtime/components/content/DashboardQuery'
import DashboardTable from '@/products/artifacts/dashboard/runtime/components/table/DashboardTable'
import DashboardText from '@/products/artifacts/dashboard/runtime/components/content/DashboardText'
import {
  DASHBOARD_SUPPORTED_COMPONENTS,
  DASHBOARD_SUPPORTED_HTML_TAG_SET,
} from '@/products/artifacts/dashboard/language/dashboardLanguageManifest'

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

function normalizeProps(input: Record<string, any> | undefined): Record<string, any> {
  const props = { ...(input || {}) }
  delete props.style
  delete props.text
  delete props.title
  delete props.children
  delete props.__path
  delete props.__layoutItem
  delete props.span
  delete props.rows
  delete props.minSpan
  delete props.x
  delete props.y
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
  appearanceOverrides: _appearanceOverrides,
  children,
}: {
  themeName?: string
  chartPaletteName?: string
  borderPreset?: string
  headerTheme?: string
  managers?: AnyRecord
  appearanceOverrides?: DashboardAppearanceOverrides
  children?: React.ReactNode
}) {
  const pageTheme = resolveDashboardPageTheme(_themeName, _appearanceOverrides)
  return (
    <DashboardThemeSelectionProvider
      appearanceOverrides={_appearanceOverrides}
      themeName={_themeName}
      chartPaletteName={_chartPaletteName}
      borderPreset={_borderPreset}
    >
      <div
        style={{
          width: '100%',
          minHeight: '100%',
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
          ...pageTheme.shell,
        }}
      >
        {children}
      </div>
    </DashboardThemeSelectionProvider>
  )
}

function DashboardTheme({ element, children }: { element: any; children?: React.ReactNode }) {
  const props = (element?.props || {}) as AnyRecord
  const { appearanceOverrides } = useDashboardThemeSelection()
  return renderDashboardThemeLayer({
    appearanceOverrides,
    themeName: typeof props.name === 'string' ? props.name : undefined,
    borderPreset: typeof props.borderPreset === 'string' ? props.borderPreset : undefined,
    headerTheme: typeof props.headerTheme === 'string' ? props.headerTheme : undefined,
    managers: (props.managers || {}) as AnyRecord,
    children,
  })
}

function DashboardSurface({ element, children }: { element: any; children?: React.ReactNode }) {
  const props = (element?.props || {}) as AnyRecord
  const { appearanceOverrides } = useDashboardThemeSelection()
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
      appearanceOverrides,
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
  const { appearanceOverrides, themeName, borderPreset } = useDashboardThemeSelection()
  const semanticStyle = resolveDashboardNodeStyle(props['data-ui'], themeName, appearanceOverrides, {
    active: props['data-active'] === true || props['data-active'] === 'true' || props['aria-selected'] === true || props['aria-selected'] === 'true',
  })
  const headerTheme = tag === 'header' ? resolveDashboardHeaderTheme(themeName, borderPreset, appearanceOverrides) : undefined
  const headerStyle = tag === 'header' ? resolveDashboardHeaderCardOverride(appearanceOverrides) : {}
  const queryDeltaColor = props['data-ui'] === 'kpi-delta' ? getDashboardQueryDeltaColor(queryResult) : undefined
  const [isHeaderEditorOpen, setIsHeaderEditorOpen] = React.useState(false)
  const [headerEditorDraft, setHeaderEditorDraft] = React.useState(() => ({
    prompt: typeof props.prompt === 'string' ? props.prompt : '',
    eyebrow: '',
    title: '',
    subtitle: '',
  }))
  const fallbackContent =
    typeof props.text === 'string'
      ? resolveDashboardQueryTemplate(props.text, queryResult)
      : typeof props.title === 'string'
        ? resolveDashboardQueryTemplate(props.title, queryResult)
        : null
  const content = children ?? fallbackContent

  const node = React.createElement(
    tag,
    {
      ...normalizeProps(props),
      style: {
        boxSizing: 'border-box',
        minWidth: 0,
        ...semanticStyle,
        ...(tag === 'header' ? (headerTheme?.card || {}) : {}),
        ...(tag === 'header' ? headerStyle : {}),
        ...(props.style && typeof props.style === 'object' ? props.style : {}),
        ...(queryDeltaColor ? { color: queryDeltaColor } : {}),
      },
    },
    content,
  )

  if (tag === 'header') {
    return (
      <DashboardHeaderScopeProvider>
        <>
          <EditableComponentOverlay onEdit={() => setIsHeaderEditorOpen(true)} forceVisible={isHeaderEditorOpen}>
            {node}
          </EditableComponentOverlay>
          <HeaderEditorModal
            isOpen={isHeaderEditorOpen}
            initialValue={headerEditorDraft}
            onClose={() => setIsHeaderEditorOpen(false)}
            onSave={(value) => {
              setHeaderEditorDraft(value)
              setIsHeaderEditorOpen(false)
            }}
          />
        </>
      </DashboardHeaderScopeProvider>
    )
  }

  return node
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
  const { appearanceOverrides, themeName } = useDashboardThemeSelection()
  const value = typeof props.value === 'string' ? props.value : ''
  const tag = typeof props.as === 'string' ? (props.as as keyof React.JSX.IntrinsicElements) : 'button'
  const active = tabs?.activeValue === value
  const semanticStyle = resolveDashboardNodeStyle('tab', themeName, appearanceOverrides, { active })
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

export const dashboardShellRegistry: Record<string, DashboardRenderComponent> = {
  DashboardTemplate: ({ children }) => <DashboardRoot>{children}</DashboardRoot>,
  Theme: ({ element, children }) => <DashboardTheme element={element}>{children}</DashboardTheme>,
  Dashboard: ({ element, children }) => <DashboardSurface element={element}>{children}</DashboardSurface>,
}

export const dashboardLayoutRegistry: Record<string, DashboardRenderComponent> = {
  Grid: ({ element, children }) => <DashboardGrid element={element}>{children}</DashboardGrid>,
  Vertical: ({ element, children }) => <DashboardVertical element={element}>{children}</DashboardVertical>,
  Horizontal: ({ element, children }) => <DashboardHorizontal element={element}>{children}</DashboardHorizontal>,
  Panel: ({ element, children }) => <DashboardPanel element={element}>{children}</DashboardPanel>,
  Card: ({ element, children }) => <DashboardCardSurface element={element}>{children}</DashboardCardSurface>,
  Tabs: ({ element, children }) => <DashboardTabs element={element}>{children}</DashboardTabs>,
  Tab: ({ element, children }) => <DashboardTab element={element}>{children}</DashboardTab>,
  TabPanel: ({ element, children }) => <DashboardTabPanel element={element}>{children}</DashboardTabPanel>,
}

export const dashboardChartRegistry: Record<string, DashboardRenderComponent> = {
  Chart: ({ element, onAction }) => <DashboardChart element={element} onAction={onAction} />,
  BarChart: ({ element, onAction }) => <DashboardChart element={{ ...element, props: { ...(element?.props || {}), type: 'bar' } }} onAction={onAction} />,
  LineChart: ({ element, onAction }) => <DashboardChart element={{ ...element, props: { ...(element?.props || {}), type: 'line' } }} onAction={onAction} />,
  PieChart: ({ element, onAction }) => <DashboardChart element={{ ...element, props: { ...(element?.props || {}), type: 'pie' } }} onAction={onAction} />,
  HorizontalBarChart: ({ element, onAction }) => <DashboardChart element={{ ...element, props: { ...(element?.props || {}), type: 'horizontal-bar' } }} onAction={onAction} />,
  ScatterChart: ({ element, onAction }) => <DashboardChart element={{ ...element, props: { ...(element?.props || {}), type: 'scatter' } }} onAction={onAction} />,
  RadarChart: ({ element, onAction }) => <DashboardChart element={{ ...element, props: { ...(element?.props || {}), type: 'radar' } }} onAction={onAction} />,
  TreemapChart: ({ element, onAction }) => <DashboardChart element={{ ...element, props: { ...(element?.props || {}), type: 'treemap' } }} onAction={onAction} />,
  ComposedChart: ({ element, onAction }) => <DashboardChart element={{ ...element, props: { ...(element?.props || {}), type: 'composed' } }} onAction={onAction} />,
  FunnelChart: ({ element, onAction }) => <DashboardChart element={{ ...element, props: { ...(element?.props || {}), type: 'funnel' } }} onAction={onAction} />,
  SankeyChart: ({ element, onAction }) => <DashboardChart element={{ ...element, props: { ...(element?.props || {}), type: 'sankey' } }} onAction={onAction} />,
  Gauge: ({ element, onAction }) => <DashboardChart element={{ ...element, props: { ...(element?.props || {}), type: 'gauge' } }} onAction={onAction} />,
}

export const dashboardDataRegistry: Record<string, DashboardRenderComponent> = {
  KPI: ({ element, children }) => <DashboardKpi element={element}>{children}</DashboardKpi>,
  KPICompare: ({ element }) => <DashboardKpiCompare element={element} />,
  Query: ({ element, children }) => <DashboardQuery element={element}>{children}</DashboardQuery>,
  Table: ({ element }) => <DashboardTable element={element} />,
  PivotTable: ({ element }) => <DashboardPivotTable element={element} />,
  Filter: ({ element, onAction }) => <DashboardFilter element={element} onAction={onAction} />,
  Select: () => null,
  OptionList: () => null,
  DatePicker: ({ element, onAction }) => <DashboardDatePicker element={element} onAction={onAction} />,
  Insights: ({ element }) => <DashboardInsights element={element} />,
}

export const dashboardContentRegistry: Record<string, DashboardRenderComponent> = {
  Icon: ({ element }) => <DashboardIcon element={element} />,
  Text: ({ element, children }) => <DashboardText element={element}>{children}</DashboardText>,
  TextNode: DashboardTextNode,
  Br: () => <br />,
}

export const dashboardRegistry: Record<string, DashboardRenderComponent> = {
  ...dashboardShellRegistry,
  ...dashboardLayoutRegistry,
  ...dashboardChartRegistry,
  ...dashboardDataRegistry,
  ...dashboardContentRegistry,
}

export function getDashboardRegistryCoverage() {
  const registered = new Set(Object.keys(dashboardRegistry))
  return {
    missing: DASHBOARD_SUPPORTED_COMPONENTS.filter((component) => !registered.has(component)),
    extra: [...registered].filter(
      (component) => !DASHBOARD_SUPPORTED_COMPONENTS.includes(component as (typeof DASHBOARD_SUPPORTED_COMPONENTS)[number]),
    ),
  }
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
