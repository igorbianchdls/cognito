'use client'

import { atom, computed } from 'nanostores'
import { $kpisAsDropped, kpiActions } from './kpiStore'
import { $tablesAsDropped, tableActions } from './tableStore'
import { $barChartsAsDropped, barChartActions } from './barChartStore'
import { $horizontalBarChartsAsDropped, horizontalBarChartActions } from './horizontalBarChartStore'
import { $lineChartsAsDropped, lineChartActions } from './lineChartStore'
import { $pieChartsAsDropped, pieChartActions } from './pieChartStore'
import { $areaChartsAsDropped, areaChartActions } from './areaChartStore'
import type { DroppedWidget } from '@/types/apps/droppedWidget'

// Dashboard clipboard interface
export interface DashboardClipboard {
  widgets: DroppedWidget[]
  timestamp: Date
  metadata: {
    totalWidgets: number
    widgetTypes: string[]
    widgetCounts: Record<string, number>
  }
}

// Store for dashboard clipboard (memory only, not localStorage)
export const $dashboardClipboard = atom<DashboardClipboard | null>(null)

// Computed store to check if clipboard has content
export const $hasDashboardInClipboard = computed([$dashboardClipboard], (clipboard) => {
  return clipboard !== null && clipboard.widgets.length > 0
})

// Actions
export const dashboardClipboardActions = {
  // Copy current dashboard to clipboard
  copy: () => {
    console.log('📋 Copying current dashboard to clipboard')
    
    // Collect all widgets from current state (same logic as savedDashboardStore)
    const kpis = $kpisAsDropped.get()
    const tables = $tablesAsDropped.get()
    const barCharts = $barChartsAsDropped.get()
    const horizontalBarCharts = $horizontalBarChartsAsDropped.get()
    const lineCharts = $lineChartsAsDropped.get()
    const pieCharts = $pieChartsAsDropped.get()
    const areaCharts = $areaChartsAsDropped.get()
    
    // Combine all widgets
    const allWidgets = [
      ...kpis,
      ...tables,
      ...barCharts,
      ...horizontalBarCharts,
      ...lineCharts,
      ...pieCharts,
      ...areaCharts
    ]
    
    // Count widgets by type
    const widgetCounts: Record<string, number> = {}
    const widgetTypes: string[] = []
    
    allWidgets.forEach(widget => {
      if (!widgetCounts[widget.type]) {
        widgetCounts[widget.type] = 0
        widgetTypes.push(widget.type)
      }
      widgetCounts[widget.type]++
    })
    
    const clipboard: DashboardClipboard = {
      widgets: allWidgets,
      timestamp: new Date(),
      metadata: {
        totalWidgets: allWidgets.length,
        widgetTypes: widgetTypes,
        widgetCounts: widgetCounts
      }
    }
    
    $dashboardClipboard.set(clipboard)
    
    console.log('✅ Dashboard copied to clipboard:', {
      totalWidgets: allWidgets.length,
      widgetCounts: widgetCounts
    })
  },

  // Paste dashboard from clipboard
  paste: () => {
    const clipboard = $dashboardClipboard.get()
    
    if (!clipboard || clipboard.widgets.length === 0) {
      console.warn('❌ No dashboard in clipboard to paste')
      return false
    }

    console.log('📋 Pasting dashboard from clipboard')
    
    // Clear all current widgets (same logic as savedDashboardStore load)
    kpiActions.setKPIs([])
    tableActions.clearAll()
    barChartActions.clearAll()
    horizontalBarChartActions.clearAll()
    lineChartActions.clearAll()
    pieChartActions.clearAll()
    areaChartActions.clearAll()
    
    console.log('🧹 Cleared current dashboard state')
    
    // Recreate widgets from clipboard in their exact positions
    const widgets = clipboard.widgets
    
    // Group widgets by type for batch operations
    const kpiWidgets = widgets.filter(w => w.type === 'kpi')
    const tableWidgets = widgets.filter(w => w.type === 'table')
    const barChartWidgets = widgets.filter(w => w.type === 'chart-bar')
    const horizontalBarChartWidgets = widgets.filter(w => w.type === 'chart-horizontal-bar')
    const lineChartWidgets = widgets.filter(w => w.type === 'chart-line')
    const pieChartWidgets = widgets.filter(w => w.type === 'chart-pie')
    const areaChartWidgets = widgets.filter(w => w.type === 'chart-area')
    
    // Recreate KPIs
    kpiWidgets.forEach(widget => {
      kpiActions.addKPI({
        name: widget.name || 'Copied KPI',
        config: widget.kpiConfig,
        position: { x: widget.x, y: widget.y },
        size: { w: widget.w, h: widget.h }
      })
    })
    
    // TODO: Implement other widget types
    // For now, focus on KPIs to get the basic system working
    
    // Recreate Tables - Simplified for now
    tableWidgets.forEach(widget => {
      // Skip tables for now - will implement after KPI system is working
      console.log('⚠️ Skipping table widget:', widget.name)
    })
    
    // Recreate Charts - Simplified for now 
    barChartWidgets.forEach(widget => {
      if (widget.barChartConfig) {
        barChartActions.addBarChart({
          ...widget.barChartConfig,
          position: { x: widget.x, y: widget.y, w: widget.w, h: widget.h }
        })
      } else {
        console.log('⚠️ Skipping bar chart widget without config:', widget.name)
      }
    })
    
    horizontalBarChartWidgets.forEach(widget => {
      if (widget.horizontalBarChartConfig) {
        horizontalBarChartActions.addHorizontalBarChart({
          ...widget.horizontalBarChartConfig,
          position: { x: widget.x, y: widget.y, w: widget.w, h: widget.h }
        })
      } else {
        console.log('⚠️ Skipping horizontal bar chart widget without config:', widget.name)
      }
    })
    
    lineChartWidgets.forEach(widget => {
      if (widget.lineChartConfig) {
        lineChartActions.addLineChart({
          ...widget.lineChartConfig,
          position: { x: widget.x, y: widget.y, w: widget.w, h: widget.h }
        })
      } else {
        console.log('⚠️ Skipping line chart widget without config:', widget.name)
      }
    })
    
    pieChartWidgets.forEach(widget => {
      if (widget.pieChartConfig) {
        pieChartActions.addPieChart({
          ...widget.pieChartConfig,
          position: { x: widget.x, y: widget.y, w: widget.w, h: widget.h }
        })
      } else {
        console.log('⚠️ Skipping pie chart widget without config:', widget.name)
      }
    })
    
    areaChartWidgets.forEach(widget => {
      if (widget.areaChartConfig) {
        areaChartActions.addAreaChart({
          ...widget.areaChartConfig,
          position: { x: widget.x, y: widget.y, w: widget.w, h: widget.h }
        })
      } else {
        console.log('⚠️ Skipping area chart widget without config:', widget.name)
      }
    })
    
    console.log('✅ Dashboard pasted successfully:', {
      kpis: kpiWidgets.length,
      tables: tableWidgets.length,
      barCharts: barChartWidgets.length,
      horizontalBarCharts: horizontalBarChartWidgets.length,
      lineCharts: lineChartWidgets.length,
      pieCharts: pieChartWidgets.length,
      areaCharts: areaChartWidgets.length,
      total: widgets.length
    })
    
    return true
  },

  // Clear clipboard
  clear: () => {
    $dashboardClipboard.set(null)
    console.log('🗑️ Dashboard clipboard cleared')
  },

  // Get clipboard info for UI
  getClipboardInfo: () => {
    const clipboard = $dashboardClipboard.get()
    if (!clipboard) return null
    
    return {
      ...clipboard.metadata,
      timestamp: clipboard.timestamp,
      timeAgo: getTimeAgo(clipboard.timestamp)
    }
  }
}

// Helper function to format time ago
function getTimeAgo(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMinutes = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  
  if (diffMinutes < 1) return 'há menos de 1 min'
  if (diffMinutes < 60) return `há ${diffMinutes} min`
  if (diffHours < 24) return `há ${diffHours}h`
  return `há ${Math.floor(diffHours / 24)} dias`
}