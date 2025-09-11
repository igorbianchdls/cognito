import { atom, computed } from 'nanostores'
import { $kpiWidgets, kpiActions } from './kpiStore'
import { $barChartStore, barChartActions, type BarChartConfig } from './barChartStore'
import { $lineChartStore, lineChartActions, type LineChartConfig } from './lineChartStore'
import { $pieChartStore, pieChartActions, type PieChartConfig } from './pieChartStore'
import { $areaChartStore, areaChartActions, type AreaChartConfig } from './areaChartStore'
import { $horizontalBarChartStore, horizontalBarChartActions, type HorizontalBarChartConfig } from './horizontalBarChartStore'
import { $tableWidgets, tableActions } from './tableStore'

// Union type for all chart configurations
type ChartConfig = BarChartConfig | LineChartConfig | PieChartConfig | AreaChartConfig | HorizontalBarChartConfig

// Common styles interface - only visual properties shared across all widgets
export interface CommonStyles {
  // Container styles
  backgroundColor?: string
  borderColor?: string
  borderRadius?: number
  borderWidth?: number
  padding?: number
  shadow?: boolean
  
  // Typography styles
  titleColor?: string
  titleFontSize?: number
  titleFontWeight?: number
  titleFontFamily?: string
  
  // Text alignment
  textAlign?: 'left' | 'center' | 'right'
}

// Style clipboard interface
export interface StyleClipboard {
  sourceWidgetId: string
  sourceWidgetType: 'kpi' | 'chart-bar' | 'chart-line' | 'chart-pie' | 'chart-area' | 'chart-horizontal-bar' | 'table'
  commonStyles: CommonStyles
  timestamp: number
}

// Main clipboard atom
export const $styleClipboard = atom<StyleClipboard | null>(null)

// Computed for checking if clipboard has styles
export const $hasStylesInClipboard = computed([$styleClipboard], (clipboard) => {
  return clipboard !== null
})

// Style extraction functions for each widget type
function extractKPIStyles(kpiId: string): CommonStyles | null {
  const kpis = $kpiWidgets.get()
  const kpi = kpis.find(k => k.i === kpiId)
  
  if (!kpi || !kpi.config) return null
  
  return {
    backgroundColor: kpi.config.backgroundColor,
    borderColor: kpi.config.borderColor,
    borderRadius: kpi.config.borderRadius,
    borderWidth: kpi.config.borderWidth,
    padding: kpi.config.padding,
    shadow: kpi.config.shadow,
    titleColor: kpi.config.nameColor,
    titleFontSize: kpi.config.nameFontSize,
    titleFontWeight: kpi.config.nameFontWeight,
    titleFontFamily: kpi.config.nameFontFamily,
    textAlign: kpi.config.textAlign
  }
}

function extractChartStyles(chartId: string, chartType: 'bar' | 'line' | 'pie' | 'area' | 'horizontal-bar'): CommonStyles | null {
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
    backgroundColor: chart.styling.backgroundColor,
    borderColor: chart.styling.containerBorderColor,
    borderRadius: chart.styling.containerBorderRadius,
    borderWidth: chart.styling.containerBorderWidth,
    padding: chart.styling.containerPadding,
    shadow: !!chart.styling.containerShadowBlur,
    titleColor: chart.styling.axisTextColor,
    titleFontSize: chart.styling.axisFontSize,
    titleFontWeight: chart.styling.axisFontWeight,
    titleFontFamily: chart.styling.axisFontFamily,
    textAlign: 'center' // Charts typically center-align
  }
}

function extractTableStyles(tableId: string): CommonStyles | null {
  const tables = $tableWidgets.get()
  const table = tables.find(t => t.i === tableId)
  
  if (!table || !table.config) return null
  
  return {
    backgroundColor: table.config.backgroundColor,
    borderColor: table.config.borderColor,
    borderRadius: table.config.borderRadius,
    borderWidth: table.config.borderWidth,
    padding: table.config.padding,
    shadow: table.config.shadow,
    titleColor: table.config.titleColor,
    titleFontSize: table.config.titleFontSize,
    titleFontWeight: table.config.titleFontWeight,
    titleFontFamily: table.config.titleFontFamily,
    textAlign: table.config.textAlign
  }
}

// Style application functions for each widget type
function applyKPIStyles(kpiId: string, styles: CommonStyles): void {
  const updates: Record<string, unknown> = {}
  
  if (styles.backgroundColor !== undefined) updates.backgroundColor = styles.backgroundColor
  if (styles.borderColor !== undefined) updates.borderColor = styles.borderColor
  if (styles.borderRadius !== undefined) updates.borderRadius = styles.borderRadius
  if (styles.borderWidth !== undefined) updates.borderWidth = styles.borderWidth
  if (styles.padding !== undefined) updates.padding = styles.padding
  if (styles.shadow !== undefined) updates.shadow = styles.shadow
  if (styles.titleColor !== undefined) updates.nameColor = styles.titleColor
  if (styles.titleFontSize !== undefined) updates.nameFontSize = styles.titleFontSize
  if (styles.titleFontWeight !== undefined) updates.nameFontWeight = styles.titleFontWeight
  if (styles.titleFontFamily !== undefined) updates.nameFontFamily = styles.titleFontFamily
  if (styles.textAlign !== undefined) updates.textAlign = styles.textAlign
  
  Object.keys(updates).forEach(key => {
    kpiActions.updateKPIConfig(kpiId, key, updates[key])
  })
}

function applyChartStyles(chartId: string, chartType: 'bar' | 'line' | 'pie' | 'area' | 'horizontal-bar', styles: CommonStyles): void {
  const stylingUpdates: Record<string, unknown> = {}
  
  if (styles.backgroundColor !== undefined) stylingUpdates.backgroundColor = styles.backgroundColor
  if (styles.borderColor !== undefined) stylingUpdates.containerBorderColor = styles.borderColor
  if (styles.borderRadius !== undefined) stylingUpdates.containerBorderRadius = styles.borderRadius
  if (styles.borderWidth !== undefined) stylingUpdates.containerBorderWidth = styles.borderWidth
  if (styles.padding !== undefined) stylingUpdates.containerPadding = styles.padding
  if (styles.shadow !== undefined) stylingUpdates.containerShadowBlur = styles.shadow ? 4 : 0
  if (styles.titleColor !== undefined) stylingUpdates.axisTextColor = styles.titleColor
  if (styles.titleFontSize !== undefined) stylingUpdates.axisFontSize = styles.titleFontSize
  if (styles.titleFontWeight !== undefined) stylingUpdates.axisFontWeight = styles.titleFontWeight
  if (styles.titleFontFamily !== undefined) stylingUpdates.axisFontFamily = styles.titleFontFamily
  
  const updates = { styling: stylingUpdates }
  
  switch (chartType) {
    case 'bar':
      barChartActions.updateBarChart(chartId, updates)
      break
    case 'line':
      lineChartActions.updateLineChart(chartId, updates)
      break
    case 'pie':
      pieChartActions.updatePieChart(chartId, updates)
      break
    case 'area':
      areaChartActions.updateAreaChart(chartId, updates)
      break
    case 'horizontal-bar':
      horizontalBarChartActions.updateHorizontalBarChart(chartId, updates)
      break
  }
}

function applyTableStyles(tableId: string, styles: CommonStyles): void {
  const updates: Record<string, unknown> = {}
  
  if (styles.backgroundColor !== undefined) updates.backgroundColor = styles.backgroundColor
  if (styles.borderColor !== undefined) updates.borderColor = styles.borderColor
  if (styles.borderRadius !== undefined) updates.borderRadius = styles.borderRadius
  if (styles.borderWidth !== undefined) updates.borderWidth = styles.borderWidth
  if (styles.padding !== undefined) updates.padding = styles.padding
  if (styles.shadow !== undefined) updates.shadow = styles.shadow
  if (styles.titleColor !== undefined) updates.titleColor = styles.titleColor
  if (styles.titleFontSize !== undefined) updates.titleFontSize = styles.titleFontSize
  if (styles.titleFontWeight !== undefined) updates.titleFontWeight = styles.titleFontWeight
  if (styles.titleFontFamily !== undefined) updates.titleFontFamily = styles.titleFontFamily
  if (styles.textAlign !== undefined) updates.textAlign = styles.textAlign
  
  Object.keys(updates).forEach(key => {
    tableActions.updateTableConfig(tableId, { [key]: updates[key] })
  })
}

// Main actions
export const styleClipboardActions = {
  copyStyles: (widgetId: string, widgetType: StyleClipboard['sourceWidgetType']) => {
    console.log('🎨 Copying styles from:', widgetType, widgetId)
    
    let commonStyles: CommonStyles | null = null
    
    switch (widgetType) {
      case 'kpi':
        commonStyles = extractKPIStyles(widgetId)
        break
      case 'chart-bar':
        commonStyles = extractChartStyles(widgetId, 'bar')
        break
      case 'chart-line':
        commonStyles = extractChartStyles(widgetId, 'line')
        break
      case 'chart-pie':
        commonStyles = extractChartStyles(widgetId, 'pie')
        break
      case 'chart-area':
        commonStyles = extractChartStyles(widgetId, 'area')
        break
      case 'chart-horizontal-bar':
        commonStyles = extractChartStyles(widgetId, 'horizontal-bar')
        break
      case 'table':
        commonStyles = extractTableStyles(widgetId)
        break
    }
    
    if (commonStyles) {
      $styleClipboard.set({
        sourceWidgetId: widgetId,
        sourceWidgetType: widgetType,
        commonStyles,
        timestamp: Date.now()
      })
      console.log('✅ Styles copied to clipboard:', commonStyles)
    } else {
      console.warn('⚠️ Could not extract styles from widget:', widgetId, widgetType)
    }
  },

  pasteStyles: (targetWidgetId: string, targetWidgetType: StyleClipboard['sourceWidgetType']) => {
    const clipboard = $styleClipboard.get()
    
    if (!clipboard) {
      console.warn('⚠️ No styles in clipboard')
      return
    }
    
    console.log('🎨 Pasting styles to:', targetWidgetType, targetWidgetId)
    
    switch (targetWidgetType) {
      case 'kpi':
        applyKPIStyles(targetWidgetId, clipboard.commonStyles)
        break
      case 'chart-bar':
        applyChartStyles(targetWidgetId, 'bar', clipboard.commonStyles)
        break
      case 'chart-line':
        applyChartStyles(targetWidgetId, 'line', clipboard.commonStyles)
        break
      case 'chart-pie':
        applyChartStyles(targetWidgetId, 'pie', clipboard.commonStyles)
        break
      case 'chart-area':
        applyChartStyles(targetWidgetId, 'area', clipboard.commonStyles)
        break
      case 'chart-horizontal-bar':
        applyChartStyles(targetWidgetId, 'horizontal-bar', clipboard.commonStyles)
        break
      case 'table':
        applyTableStyles(targetWidgetId, clipboard.commonStyles)
        break
    }
    
    console.log('✅ Styles applied successfully')
  },

  clearClipboard: () => {
    console.log('🗑️ Clearing style clipboard')
    $styleClipboard.set(null)
  }
}