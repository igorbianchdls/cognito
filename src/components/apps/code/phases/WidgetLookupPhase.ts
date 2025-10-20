import { $kpiWidgets } from '@/stores/apps/kpiStore'
import { $tableWidgets } from '@/stores/apps/tableStore'
import { $barChartStore } from '@/stores/apps/barChartStore'
import { $lineChartStore } from '@/stores/apps/lineChartStore'
import { $pieChartStore } from '@/stores/apps/pieChartStore'
import { $areaChartStore } from '@/stores/apps/areaChartStore'
import { $horizontalBarChartStore } from '@/stores/apps/horizontalBarChartStore'

/**
 * WidgetLookupPhase - Find existing widgets by name
 * 
 * All functions copied exactly from CodeEditor.tsx
 */

export class WidgetLookupPhase {

  /**
   * Find existing KPI by name (copied from CodeEditor line 58-59)
   */
  static findExistingKPI(kpiName: string) {
    const currentKPIs = $kpiWidgets.get()
    const existingKPI = currentKPIs.find(kpi => kpi.config.name === kpiName)
    return existingKPI
  }

  /**
   * Find existing Chart by name (copied from CodeEditor lines 149-180)
   */
  static findExistingChart(chartName: string) {
    // Search in all chart stores
    const barCharts = $barChartStore.get().barCharts
    const lineCharts = $lineChartStore.get().lineCharts
    const pieCharts = $pieChartStore.get().pieCharts
    const areaCharts = $areaChartStore.get().areaCharts
    const horizontalBarCharts = $horizontalBarChartStore.get().horizontalBarCharts

    let existingChart: { id: string; name: string; bigqueryData: { selectedTable: string | null; columns: { xAxis: { name: string; type: string }[]; yAxis: { name: string; type: string; aggregation?: string }[]; filters: { name: string; type: string }[] } }; styling?: Record<string, unknown>; position?: { x: number; y: number; w: number; h: number } } | undefined = undefined
    let chartType: 'bar' | 'line' | 'pie' | 'area' | 'horizontal-bar' | null = null
    
    existingChart = barCharts.find(chart => chart.name === chartName)
    if (existingChart) chartType = 'bar'
    
    if (!existingChart) {
      existingChart = lineCharts.find(chart => chart.name === chartName)
      if (existingChart) chartType = 'line'
    }
    
    if (!existingChart) {
      existingChart = pieCharts.find(chart => chart.name === chartName)
      if (existingChart) chartType = 'pie'
    }
    
    if (!existingChart) {
      existingChart = areaCharts.find(chart => chart.name === chartName)
      if (existingChart) chartType = 'area'
    }
    
    if (!existingChart) {
      existingChart = horizontalBarCharts.find(chart => chart.name === chartName)
      if (existingChart) chartType = 'horizontal-bar'
    }

    return { existingChart, chartType }
  }

  /**
   * Find existing Table by name (copied from CodeEditor lines 405-406)
   */
  static findExistingTable(tableName: string) {
    const currentTables = $tableWidgets.get()
    const existingTable = currentTables.find(table => table.name === tableName)
    return existingTable
  }
}