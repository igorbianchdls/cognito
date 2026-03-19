'use client'

import React from 'react'

import JsonRenderBarChart from '@/products/bi/json-render/components/BarChart'
import JsonRenderLineChart from '@/products/bi/json-render/components/LineChart'
import JsonRenderPieChart from '@/products/bi/json-render/components/PieChart'
import { registry as biRegistry } from '@/products/bi/json-render/registry'

export function normalizeChartType(input: unknown): string {
  const raw = String(input || '')
    .trim()
    .toLowerCase()
    .replace(/_/g, '-')
    .replace(/\s+/g, '-')
  if (raw === 'barchart') return 'bar'
  if (raw === 'linechart') return 'line'
  if (raw === 'piechart') return 'pie'
  if (raw === 'horizontalbar' || raw === 'horizontal-bar') return 'horizontal-bar'
  if (raw === 'horizontalbarchart' || raw === 'horizontal-bar-chart') return 'horizontal-bar'
  if (raw === 'scatterchart') return 'scatter'
  if (raw === 'radarchart') return 'radar'
  if (raw === 'treemapchart') return 'treemap'
  if (raw === 'composedchart') return 'composed'
  if (raw === 'funnelchart') return 'funnel'
  if (raw === 'sankeychart') return 'sankey'
  if (raw === 'gaugechart') return 'gauge'
  return raw
}

export function renderChartByType(chartType: unknown, element: any, onAction?: (action: any) => void) {
  const normalized = normalizeChartType(chartType)
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
