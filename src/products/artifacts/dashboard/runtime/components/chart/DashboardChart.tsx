'use client'

import React from 'react'

import JsonRenderBarChart from '@/products/bi/json-render/components/BarChart'
import JsonRenderComposedChart from '@/products/bi/json-render/components/ComposedChart'
import JsonRenderFunnelChart from '@/products/bi/json-render/components/FunnelChart'
import JsonRenderGauge from '@/products/bi/json-render/components/Gauge'
import JsonRenderHorizontalBarChart from '@/products/bi/json-render/components/HorizontalBarChart'
import JsonRenderLineChart from '@/products/bi/json-render/components/LineChart'
import JsonRenderPieChart from '@/products/bi/json-render/components/PieChart'
import JsonRenderRadarChart from '@/products/bi/json-render/components/RadarChart'
import JsonRenderSankeyChart from '@/products/bi/json-render/components/SankeyChart'
import JsonRenderScatterChart from '@/products/bi/json-render/components/ScatterChart'
import JsonRenderTreemapChart from '@/products/bi/json-render/components/TreemapChart'
import { normalizeDashboardChartType } from '@/products/artifacts/dashboard/language/dashboardLanguageManifest'
import { ChartEditorModal } from '@/products/artifacts/dashboard/runtime/components/chart/ChartEditorModal'
import { EditableComponentOverlay } from '@/products/artifacts/dashboard/runtime/editing/EditableComponentOverlay'
import {
  resolveDashboardChartTheme,
  resolveDashboardGaugeTheme,
  useDashboardThemeSelection,
} from '@/products/artifacts/dashboard/runtime/theme'
import { deepMerge } from '@/stores/ui/json-render/utils'

type AnyRecord = Record<string, any>

const chartDefaults = {
  bar: {
    height: 220,
    format: 'number',
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
  },
  scatter: {
    height: 260,
    format: 'number',
    titleStyle: { padding: 6, textAlign: 'left' },
    colorScheme: ['#3b82f6', '#10b981', '#f59e0b'],
    nivo: { range: [60, 360], animate: true },
  },
  radar: {
    height: 260,
    format: 'number',
    titleStyle: { padding: 6, textAlign: 'left' },
    colorScheme: ['#3b82f6', '#10b981', '#f59e0b'],
    nivo: { outerRadius: '72%', fillOpacity: 0.28, animate: true },
  },
  treemap: {
    height: 280,
    format: 'number',
    titleStyle: { padding: 6, textAlign: 'left' },
    colorScheme: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'],
    nivo: { aspectRatio: 4 / 3, animate: true },
  },
  composed: {
    height: 280,
    format: 'number',
    titleStyle: { padding: 6, textAlign: 'left' },
    colorScheme: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'],
    nivo: { gridX: false, gridY: true, curve: 'monotone', animate: true },
  },
  funnel: {
    height: 300,
    format: 'number',
    titleStyle: { padding: 6, textAlign: 'left' },
    colorScheme: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'],
    nivo: { animate: true },
  },
  sankey: {
    height: 360,
    format: 'number',
    titleStyle: { padding: 6, textAlign: 'left' },
    colorScheme: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'],
    nivo: { nodePadding: 14, nodeWidth: 14, linkCurvature: 0.5, iterations: 32, sort: true, animate: true },
  },
  gauge: {
    format: 'number',
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
  },
} satisfies Record<string, AnyRecord>

function useMergedElementProps(element: any, defaults: AnyRecord, componentName: string): { props: AnyRecord } {
  const { appearanceOverrides, chartPaletteName, themeName } = useDashboardThemeSelection()
  const chartTheme = resolveDashboardChartTheme(themeName, chartPaletteName, appearanceOverrides)
  const themeComponent =
    componentName === 'Gauge'
      ? (resolveDashboardGaugeTheme(themeName) as AnyRecord)
      : ({
          titleStyle: chartTheme.titleStyle,
          colorScheme: chartTheme.colorScheme,
          grid: chartTheme.grid,
          xAxis: chartTheme.xAxis,
          yAxis: chartTheme.yAxis,
          tooltip: chartTheme.tooltip,
          legend: chartTheme.legend,
          margin: chartTheme.margin,
        } as AnyRecord)
  return {
    props: deepMerge(deepMerge(defaults, themeComponent), (element?.props || {}) as AnyRecord),
  }
}

function ThemedChart({
  component: Component,
  componentName,
  defaults,
  element,
}: {
  component: React.ComponentType<{ element: any }>
  componentName: string
  defaults: AnyRecord
  element: any
}) {
  return <Component element={useMergedElementProps(element, defaults, componentName)} />
}

function renderChartByType(chartType: unknown, element: any) {
  const normalized = normalizeDashboardChartType(chartType)
  if (normalized === 'bar') return <JsonRenderBarChart element={element} />
  if (normalized === 'line') return <JsonRenderLineChart element={element} />
  if (normalized === 'pie') return <JsonRenderPieChart element={element} />
  if (normalized === 'horizontal-bar') return <ThemedChart component={JsonRenderHorizontalBarChart} componentName="HorizontalBarChart" defaults={chartDefaults.bar} element={element} />
  if (normalized === 'scatter') return <ThemedChart component={JsonRenderScatterChart} componentName="ScatterChart" defaults={chartDefaults.scatter} element={element} />
  if (normalized === 'radar') return <ThemedChart component={JsonRenderRadarChart} componentName="RadarChart" defaults={chartDefaults.radar} element={element} />
  if (normalized === 'treemap') return <ThemedChart component={JsonRenderTreemapChart} componentName="TreemapChart" defaults={chartDefaults.treemap} element={element} />
  if (normalized === 'composed') return <ThemedChart component={JsonRenderComposedChart} componentName="ComposedChart" defaults={chartDefaults.composed} element={element} />
  if (normalized === 'funnel') return <ThemedChart component={JsonRenderFunnelChart} componentName="FunnelChart" defaults={chartDefaults.funnel} element={element} />
  if (normalized === 'sankey') return <ThemedChart component={JsonRenderSankeyChart} componentName="SankeyChart" defaults={chartDefaults.sankey} element={element} />
  if (normalized === 'gauge') return <ThemedChart component={JsonRenderGauge} componentName="Gauge" defaults={chartDefaults.gauge} element={element} />

  return (
    <div className="rounded border border-yellow-300 bg-yellow-50 p-2 text-xs text-yellow-800">
      Unsupported chart type: {normalized || 'unknown'}
    </div>
  )
}

export default function DashboardChart({
  element,
}: {
  element: any
  onAction?: (action: any) => void
}) {
  const { appearanceOverrides, chartPaletteName, themeName } = useDashboardThemeSelection()
  const chartTheme = resolveDashboardChartTheme(themeName, chartPaletteName, appearanceOverrides)
  const type = (element?.props || {}).type
  const props = (element?.props || {}) as AnyRecord
  const [isEditorOpen, setIsEditorOpen] = React.useState(false)
  const [editorDraft, setEditorDraft] = React.useState(() => ({
    prompt: typeof props.prompt === 'string' ? props.prompt : '',
    chartType: typeof type === 'string' ? type : 'bar',
    format: typeof props.format === 'string' ? props.format : 'number',
    height: props.height === undefined ? '' : String(props.height),
    query:
      props.dataQuery && typeof props.dataQuery === 'object' && typeof (props.dataQuery as AnyRecord).query === 'string'
        ? String((props.dataQuery as AnyRecord).query)
        : '',
  }))
  const defaults = {
    titleStyle: chartTheme.titleStyle,
    colorScheme: chartTheme.colorScheme,
    grid: chartTheme.grid,
    xAxis: chartTheme.xAxis,
    yAxis: chartTheme.yAxis,
    tooltip: chartTheme.tooltip,
    legend: chartTheme.legend,
    margin: chartTheme.margin,
    ...(normalizeDashboardChartType(type) === 'gauge' ? resolveDashboardGaugeTheme(themeName) : {}),
  } as AnyRecord
  const chartNode = renderChartByType(type, {
    ...element,
    props: deepMerge(defaults, (element?.props || {}) as AnyRecord),
  })

  return (
    <>
      <EditableComponentOverlay onEdit={() => setIsEditorOpen(true)} forceVisible={isEditorOpen}>
        {chartNode}
      </EditableComponentOverlay>
      <ChartEditorModal
        isOpen={isEditorOpen}
        initialValue={editorDraft}
        onClose={() => setIsEditorOpen(false)}
        onSave={(value) => {
          setEditorDraft(value)
          setIsEditorOpen(false)
        }}
      />
    </>
  )
}
