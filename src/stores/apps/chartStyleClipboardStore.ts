import { atom, computed } from 'nanostores'
import { $barChartStore, barChartActions, type BarChartConfig } from './barChartStore'
import { $lineChartStore, lineChartActions, type LineChartConfig } from './lineChartStore'
import { $pieChartStore, pieChartActions, type PieChartConfig } from './pieChartStore'
import { $areaChartStore, areaChartActions, type AreaChartConfig } from './areaChartStore'
import { $horizontalBarChartStore, horizontalBarChartActions, type HorizontalBarChartConfig } from './horizontalBarChartStore'

// Union type for all chart configurations
type ChartConfig = BarChartConfig | LineChartConfig | PieChartConfig | AreaChartConfig | HorizontalBarChartConfig

// Comprehensive chart styles interface - all chart visual properties
export interface CommonChartStyles {
  // Typography - Axis
  axisFontFamily?: string
  axisFontSize?: number
  axisFontWeight?: number
  axisTextColor?: string
  axisLegendFontSize?: number
  axisLegendFontWeight?: number
  
  // Typography - Labels
  labelsFontFamily?: string
  labelsFontSize?: number
  labelsFontWeight?: number
  labelsTextColor?: string
  
  // Typography - Legends
  legendsFontFamily?: string
  legendsFontSize?: number
  legendsFontWeight?: number
  legendsTextColor?: string
  
  // Typography - Tooltip
  tooltipFontSize?: number
  tooltipFontFamily?: string
  
  // Container Border & Layout
  containerBorderWidth?: number
  containerBorderColor?: string
  containerBorderRadius?: number
  containerPadding?: number
  
  // Container Shadow
  containerShadowColor?: string
  containerShadowOpacity?: number
  containerShadowBlur?: number
  containerShadowOffsetX?: number
  containerShadowOffsetY?: number
  
  // Colors
  colors?: string[]
  borderRadius?: number
  borderWidth?: number
  borderColor?: string
}

// Chart style clipboard interface
export interface ChartStyleClipboard {
  sourceWidgetId: string
  sourceWidgetType: 'chart-bar' | 'chart-line' | 'chart-pie' | 'chart-area' | 'chart-horizontal-bar'
  commonStyles: CommonChartStyles
  timestamp: number
}

// Main clipboard atom
export const $chartStyleClipboard = atom<ChartStyleClipboard | null>(null)

// Computed for checking if clipboard has styles
export const $hasChartStylesInClipboard = computed([$chartStyleClipboard], (clipboard) => {
  return clipboard !== null
})

// Extract styles from any chart type
function extractChartStyles(chartId: string, chartType: 'bar' | 'line' | 'pie' | 'area' | 'horizontal-bar'): CommonChartStyles | null {
  let chart: ChartConfig | null = null
  
  switch (chartType) {
    case 'bar':
      chart = $barChartStore.get().barCharts.find(c => c.id === chartId) ?? null
      break
    case 'line':
      chart = $lineChartStore.get().lineCharts.find(c => c.id === chartId) ?? null
      break
    case 'pie':
      chart = $pieChartStore.get().pieCharts.find(c => c.id === chartId) ?? null
      break
    case 'area':
      chart = $areaChartStore.get().areaCharts.find(c => c.id === chartId) ?? null
      break
    case 'horizontal-bar':
      chart = $horizontalBarChartStore.get().horizontalBarCharts.find(c => c.id === chartId) ?? null
      break
  }
  
  if (!chart || !chart.styling) return null
  
  return {
    // Typography - Axis
    axisFontFamily: chart.styling.axisFontFamily,
    axisFontSize: chart.styling.axisFontSize,
    axisFontWeight: chart.styling.axisFontWeight,
    axisTextColor: chart.styling.axisTextColor,
    axisLegendFontSize: chart.styling.axisLegendFontSize,
    axisLegendFontWeight: chart.styling.axisLegendFontWeight,
    
    // Typography - Labels
    labelsFontFamily: chart.styling.labelsFontFamily,
    labelsFontSize: chart.styling.labelsFontSize,
    labelsFontWeight: chart.styling.labelsFontWeight,
    labelsTextColor: chart.styling.labelsTextColor,
    
    // Typography - Legends
    legendsFontFamily: chart.styling.legendsFontFamily,
    legendsFontSize: chart.styling.legendsFontSize,
    legendsFontWeight: chart.styling.legendsFontWeight,
    legendsTextColor: chart.styling.legendsTextColor,
    
    // Typography - Tooltip
    tooltipFontSize: chart.styling.tooltipFontSize,
    tooltipFontFamily: chart.styling.tooltipFontFamily,
    
    // Container
    containerBorderWidth: chart.styling.containerBorderWidth,
    containerBorderColor: chart.styling.containerBorderColor,
    containerBorderRadius: chart.styling.containerBorderRadius,
    containerPadding: chart.styling.containerPadding,
    
    // Shadow
    containerShadowColor: chart.styling.containerShadowColor,
    containerShadowOpacity: chart.styling.containerShadowOpacity,
    containerShadowBlur: chart.styling.containerShadowBlur,
    containerShadowOffsetX: chart.styling.containerShadowOffsetX,
    containerShadowOffsetY: chart.styling.containerShadowOffsetY,
    
    // Colors
    colors: chart.styling.colors,
    borderRadius: chart.styling.borderRadius,
    borderWidth: chart.styling.borderWidth,
    borderColor: chart.styling.borderColor
  }
}

// Apply styles to any chart type
function applyChartStyles(chartId: string, chartType: 'bar' | 'line' | 'pie' | 'area' | 'horizontal-bar', styles: CommonChartStyles): void {
  const stylingUpdates: Record<string, unknown> = {}
  
  // Typography - Axis
  if (styles.axisFontFamily !== undefined) stylingUpdates.axisFontFamily = styles.axisFontFamily
  if (styles.axisFontSize !== undefined) stylingUpdates.axisFontSize = styles.axisFontSize
  if (styles.axisFontWeight !== undefined) stylingUpdates.axisFontWeight = styles.axisFontWeight
  if (styles.axisTextColor !== undefined) stylingUpdates.axisTextColor = styles.axisTextColor
  if (styles.axisLegendFontSize !== undefined) stylingUpdates.axisLegendFontSize = styles.axisLegendFontSize
  if (styles.axisLegendFontWeight !== undefined) stylingUpdates.axisLegendFontWeight = styles.axisLegendFontWeight
  
  // Typography - Labels
  if (styles.labelsFontFamily !== undefined) stylingUpdates.labelsFontFamily = styles.labelsFontFamily
  if (styles.labelsFontSize !== undefined) stylingUpdates.labelsFontSize = styles.labelsFontSize
  if (styles.labelsFontWeight !== undefined) stylingUpdates.labelsFontWeight = styles.labelsFontWeight
  if (styles.labelsTextColor !== undefined) stylingUpdates.labelsTextColor = styles.labelsTextColor
  
  // Typography - Legends
  if (styles.legendsFontFamily !== undefined) stylingUpdates.legendsFontFamily = styles.legendsFontFamily
  if (styles.legendsFontSize !== undefined) stylingUpdates.legendsFontSize = styles.legendsFontSize
  if (styles.legendsFontWeight !== undefined) stylingUpdates.legendsFontWeight = styles.legendsFontWeight
  if (styles.legendsTextColor !== undefined) stylingUpdates.legendsTextColor = styles.legendsTextColor
  
  // Typography - Tooltip
  if (styles.tooltipFontSize !== undefined) stylingUpdates.tooltipFontSize = styles.tooltipFontSize
  if (styles.tooltipFontFamily !== undefined) stylingUpdates.tooltipFontFamily = styles.tooltipFontFamily
  
  // Container
  if (styles.containerBorderWidth !== undefined) stylingUpdates.containerBorderWidth = styles.containerBorderWidth
  if (styles.containerBorderColor !== undefined) stylingUpdates.containerBorderColor = styles.containerBorderColor
  if (styles.containerBorderRadius !== undefined) stylingUpdates.containerBorderRadius = styles.containerBorderRadius
  if (styles.containerPadding !== undefined) stylingUpdates.containerPadding = styles.containerPadding
  
  // Shadow
  if (styles.containerShadowColor !== undefined) stylingUpdates.containerShadowColor = styles.containerShadowColor
  if (styles.containerShadowOpacity !== undefined) stylingUpdates.containerShadowOpacity = styles.containerShadowOpacity
  if (styles.containerShadowBlur !== undefined) stylingUpdates.containerShadowBlur = styles.containerShadowBlur
  if (styles.containerShadowOffsetX !== undefined) stylingUpdates.containerShadowOffsetX = styles.containerShadowOffsetX
  if (styles.containerShadowOffsetY !== undefined) stylingUpdates.containerShadowOffsetY = styles.containerShadowOffsetY
  
  // Colors
  if (styles.colors !== undefined) stylingUpdates.colors = styles.colors
  if (styles.borderRadius !== undefined) stylingUpdates.borderRadius = styles.borderRadius
  if (styles.borderWidth !== undefined) stylingUpdates.borderWidth = styles.borderWidth
  if (styles.borderColor !== undefined) stylingUpdates.borderColor = styles.borderColor
  
  // Get existing chart config and merge styling updates
  let existingChart: ChartConfig | undefined
  
  switch (chartType) {
    case 'bar':
      existingChart = $barChartStore.get().barCharts.find(chart => chart.id === chartId)
      if (existingChart) {
        const updatedStyling = { ...existingChart.styling, ...stylingUpdates }
        barChartActions.updateBarChart(chartId, { styling: updatedStyling })
      }
      break
    case 'line':
      existingChart = $lineChartStore.get().lineCharts.find(chart => chart.id === chartId)
      if (existingChart) {
        const updatedStyling = { ...existingChart.styling, ...stylingUpdates }
        lineChartActions.updateLineChart(chartId, { styling: updatedStyling })
      }
      break
    case 'pie':
      existingChart = $pieChartStore.get().pieCharts.find(chart => chart.id === chartId)
      if (existingChart) {
        const updatedStyling = { ...existingChart.styling, ...stylingUpdates }
        pieChartActions.updatePieChart(chartId, { styling: updatedStyling })
      }
      break
    case 'area':
      existingChart = $areaChartStore.get().areaCharts.find(chart => chart.id === chartId)
      if (existingChart) {
        const updatedStyling = { ...existingChart.styling, ...stylingUpdates }
        areaChartActions.updateAreaChart(chartId, { styling: updatedStyling })
      }
      break
    case 'horizontal-bar':
      existingChart = $horizontalBarChartStore.get().horizontalBarCharts.find(chart => chart.id === chartId)
      if (existingChart) {
        const updatedStyling = { ...existingChart.styling, ...stylingUpdates }
        horizontalBarChartActions.updateHorizontalBarChart(chartId, { styling: updatedStyling })
      }
      break
  }
}

// Main actions - Charts only
export const chartStyleClipboardActions = {
  copyStyles: (widgetId: string, widgetType: ChartStyleClipboard['sourceWidgetType']) => {
    console.log('🎨 Copying Chart styles from:', widgetType, widgetId)
    
    const chartType = widgetType.replace('chart-', '') as 'bar' | 'line' | 'pie' | 'area' | 'horizontal-bar'
    const commonStyles = extractChartStyles(widgetId, chartType)
    
    if (commonStyles) {
      $chartStyleClipboard.set({
        sourceWidgetId: widgetId,
        sourceWidgetType: widgetType,
        commonStyles,
        timestamp: Date.now()
      })
      console.log('✅ Chart styles copied to clipboard:', commonStyles)
    } else {
      console.warn('⚠️ Could not extract styles from chart:', widgetId, widgetType)
    }
  },

  pasteStyles: (targetWidgetId: string, targetWidgetType: ChartStyleClipboard['sourceWidgetType']) => {
    const clipboard = $chartStyleClipboard.get()
    
    if (!clipboard) {
      console.warn('⚠️ No chart styles in clipboard')
      return
    }
    
    console.log('🎨 Pasting Chart styles to:', targetWidgetType, targetWidgetId)
    const chartType = targetWidgetType.replace('chart-', '') as 'bar' | 'line' | 'pie' | 'area' | 'horizontal-bar'
    applyChartStyles(targetWidgetId, chartType, clipboard.commonStyles)
    console.log('✅ Chart styles applied successfully')
  },

  clearClipboard: () => {
    console.log('🗑️ Clearing chart style clipboard')
    $chartStyleClipboard.set(null)
  }
}