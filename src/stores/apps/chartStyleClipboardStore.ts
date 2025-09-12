import { atom, computed } from 'nanostores'
import { $barChartStore, barChartActions, type BarChartConfig } from './barChartStore'
import { $lineChartStore, lineChartActions, type LineChartConfig } from './lineChartStore'
import { $pieChartStore, pieChartActions, type PieChartConfig } from './pieChartStore'
import { $areaChartStore, areaChartActions, type AreaChartConfig } from './areaChartStore'
import { $horizontalBarChartStore, horizontalBarChartActions, type HorizontalBarChartConfig } from './horizontalBarChartStore'

// Union type for all chart configurations
type ChartConfig = BarChartConfig | LineChartConfig | PieChartConfig | AreaChartConfig | HorizontalBarChartConfig

// Comprehensive chart styles interface - all chart visual properties (common + specific)
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
  
  // Colors & Common Chart Properties
  colors?: string[]
  borderRadius?: number
  borderWidth?: number
  borderColor?: string
  showLegend?: boolean
  showGrid?: boolean
  enableGridX?: boolean
  enableGridY?: boolean
  legendPosition?: 'top' | 'top-right' | 'right' | 'bottom-right' | 'bottom' | 'bottom-left' | 'left' | 'top-left'
  legendDirection?: 'row' | 'column'
  legendSpacing?: number
  legendSymbolSize?: number
  legendSymbolShape?: 'circle' | 'square' | 'triangle'
  title?: string
  style?: string
  marginTop?: number
  marginRight?: number
  marginBottom?: number
  marginLeft?: number
  
  // Bar Chart Specific Properties
  groupMode?: 'grouped' | 'stacked'
  layout?: 'horizontal' | 'vertical'
  padding?: number
  innerPadding?: number
  xAxisTitle?: string
  yAxisTitle?: string
  enableLabel?: boolean
  labelPosition?: 'start' | 'middle' | 'end'
  labelSkipWidth?: number
  labelSkipHeight?: number
  labelTextColor?: string
  labelFormat?: string
  labelOffset?: number
  xAxisLegend?: string
  xAxisLegendPosition?: 'start' | 'middle' | 'end'
  xAxisLegendOffset?: number
  xAxisTickRotation?: number
  xAxisTickSize?: number
  xAxisTickPadding?: number
  yAxisLegend?: string
  yAxisLegendOffset?: number
  yAxisTickRotation?: number
  yAxisTickSize?: number
  yAxisTickPadding?: number
  
  // Pie Chart Specific Properties
  innerRadius?: number
  outerRadius?: number
  padAngle?: number
  cornerRadius?: number
  activeOuterRadiusOffset?: number
  enableLabels?: boolean
  labelFormat?: 'percentage' | 'value' | 'both'
  enableArcLabels?: boolean
  enableArcLinkLabels?: boolean
  arcLabelsSkipAngle?: number
  arcLabelsTextColor?: string
  arcLinkLabelsSkipAngle?: number
  arcLinkLabelsTextColor?: string
  
  // Line Chart Specific Properties
  enableDots?: boolean
  dotSize?: number
  enableArea?: boolean
  areaOpacity?: number
  lineWidth?: number
  enableSlices?: boolean
  
  // Area Chart Specific Properties
  areaBaselineValue?: number
  enableStacking?: boolean
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

// Extract styles from any chart type - includes ALL properties (common + specific)
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
  
  const styles: CommonChartStyles = {
    // Typography - Axis (common)
    axisFontFamily: chart.styling.axisFontFamily,
    axisFontSize: chart.styling.axisFontSize,
    axisFontWeight: chart.styling.axisFontWeight,
    axisTextColor: chart.styling.axisTextColor,
    axisLegendFontSize: chart.styling.axisLegendFontSize,
    axisLegendFontWeight: chart.styling.axisLegendFontWeight,
    
    // Typography - Labels (common)
    labelsFontFamily: chart.styling.labelsFontFamily,
    labelsFontSize: chart.styling.labelsFontSize,
    labelsFontWeight: chart.styling.labelsFontWeight,
    labelsTextColor: chart.styling.labelsTextColor,
    
    // Typography - Legends (common)
    legendsFontFamily: chart.styling.legendsFontFamily,
    legendsFontSize: chart.styling.legendsFontSize,
    legendsFontWeight: chart.styling.legendsFontWeight,
    legendsTextColor: chart.styling.legendsTextColor,
    
    // Typography - Tooltip (common)
    tooltipFontSize: chart.styling.tooltipFontSize,
    tooltipFontFamily: chart.styling.tooltipFontFamily,
    
    // Container (common)
    containerBorderWidth: chart.styling.containerBorderWidth,
    containerBorderColor: chart.styling.containerBorderColor,
    containerBorderRadius: chart.styling.containerBorderRadius,
    containerPadding: chart.styling.containerPadding,
    
    // Shadow (common)
    containerShadowColor: chart.styling.containerShadowColor,
    containerShadowOpacity: chart.styling.containerShadowOpacity,
    containerShadowBlur: chart.styling.containerShadowBlur,
    containerShadowOffsetX: chart.styling.containerShadowOffsetX,
    containerShadowOffsetY: chart.styling.containerShadowOffsetY,
    
    // Colors & Common Chart Properties
    colors: chart.styling.colors,
    borderRadius: chart.styling.borderRadius,
    borderWidth: chart.styling.borderWidth,
    borderColor: chart.styling.borderColor,
    showLegend: chart.styling.showLegend,
    showGrid: chart.styling.showGrid,
    enableGridX: chart.styling.enableGridX,
    enableGridY: chart.styling.enableGridY,
    legendPosition: chart.styling.legendPosition,
    legendDirection: chart.styling.legendDirection,
    legendSpacing: chart.styling.legendSpacing,
    legendSymbolSize: chart.styling.legendSymbolSize,
    legendSymbolShape: chart.styling.legendSymbolShape,
    title: chart.styling.title,
    style: chart.styling.style,
    marginTop: chart.styling.marginTop,
    marginRight: chart.styling.marginRight,
    marginBottom: chart.styling.marginBottom,
    marginLeft: chart.styling.marginLeft
  }
  
  // Add type-specific properties with IFs
  if (chartType === 'bar' || chartType === 'horizontal-bar') {
    styles.groupMode = chart.styling.groupMode
    styles.layout = chart.styling.layout
    styles.padding = chart.styling.padding
    styles.innerPadding = chart.styling.innerPadding
    styles.xAxisTitle = chart.styling.xAxisTitle
    styles.yAxisTitle = chart.styling.yAxisTitle
    styles.enableLabel = chart.styling.enableLabel
    styles.labelPosition = chart.styling.labelPosition
    styles.labelSkipWidth = chart.styling.labelSkipWidth
    styles.labelSkipHeight = chart.styling.labelSkipHeight
    styles.labelTextColor = chart.styling.labelTextColor
    styles.labelFormat = chart.styling.labelFormat
    styles.labelOffset = chart.styling.labelOffset
    styles.xAxisLegend = chart.styling.xAxisLegend
    styles.xAxisLegendPosition = chart.styling.xAxisLegendPosition
    styles.xAxisLegendOffset = chart.styling.xAxisLegendOffset
    styles.xAxisTickRotation = chart.styling.xAxisTickRotation
    styles.xAxisTickSize = chart.styling.xAxisTickSize
    styles.xAxisTickPadding = chart.styling.xAxisTickPadding
    styles.yAxisLegend = chart.styling.yAxisLegend
    styles.yAxisLegendOffset = chart.styling.yAxisLegendOffset
    styles.yAxisTickRotation = chart.styling.yAxisTickRotation
    styles.yAxisTickSize = chart.styling.yAxisTickSize
    styles.yAxisTickPadding = chart.styling.yAxisTickPadding
  }
  
  if (chartType === 'pie') {
    styles.innerRadius = chart.styling.innerRadius
    styles.outerRadius = chart.styling.outerRadius
    styles.padAngle = chart.styling.padAngle
    styles.cornerRadius = chart.styling.cornerRadius
    styles.activeOuterRadiusOffset = chart.styling.activeOuterRadiusOffset
    styles.enableLabels = chart.styling.enableLabels
    styles.enableArcLabels = chart.styling.enableArcLabels
    styles.enableArcLinkLabels = chart.styling.enableArcLinkLabels
    styles.arcLabelsSkipAngle = chart.styling.arcLabelsSkipAngle
    styles.arcLabelsTextColor = chart.styling.arcLabelsTextColor
    styles.arcLinkLabelsSkipAngle = chart.styling.arcLinkLabelsSkipAngle
    styles.arcLinkLabelsTextColor = chart.styling.arcLinkLabelsTextColor
  }
  
  if (chartType === 'line') {
    styles.enableDots = chart.styling.enableDots
    styles.dotSize = chart.styling.dotSize
    styles.enableArea = chart.styling.enableArea
    styles.areaOpacity = chart.styling.areaOpacity
    styles.lineWidth = chart.styling.lineWidth
    styles.enableSlices = chart.styling.enableSlices
  }
  
  if (chartType === 'area') {
    styles.enableStacking = chart.styling.enableStacking
    styles.areaBaselineValue = chart.styling.areaBaselineValue
  }
  
  return styles
}

// Apply styles to any chart type with intelligent compatibility
function applyChartStyles(chartId: string, chartType: 'bar' | 'line' | 'pie' | 'area' | 'horizontal-bar', styles: CommonChartStyles): void {
  const stylingUpdates: Record<string, unknown> = {}
  
  // Common properties (applied to all chart types)
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
  
  // Colors & Common Chart Properties
  if (styles.colors !== undefined) stylingUpdates.colors = styles.colors
  if (styles.borderRadius !== undefined) stylingUpdates.borderRadius = styles.borderRadius
  if (styles.borderWidth !== undefined) stylingUpdates.borderWidth = styles.borderWidth
  if (styles.borderColor !== undefined) stylingUpdates.borderColor = styles.borderColor
  if (styles.showLegend !== undefined) stylingUpdates.showLegend = styles.showLegend
  if (styles.showGrid !== undefined) stylingUpdates.showGrid = styles.showGrid
  if (styles.enableGridX !== undefined) stylingUpdates.enableGridX = styles.enableGridX
  if (styles.enableGridY !== undefined) stylingUpdates.enableGridY = styles.enableGridY
  if (styles.legendPosition !== undefined) stylingUpdates.legendPosition = styles.legendPosition
  if (styles.legendDirection !== undefined) stylingUpdates.legendDirection = styles.legendDirection
  if (styles.legendSpacing !== undefined) stylingUpdates.legendSpacing = styles.legendSpacing
  if (styles.legendSymbolSize !== undefined) stylingUpdates.legendSymbolSize = styles.legendSymbolSize
  if (styles.legendSymbolShape !== undefined) stylingUpdates.legendSymbolShape = styles.legendSymbolShape
  if (styles.title !== undefined) stylingUpdates.title = styles.title
  if (styles.style !== undefined) stylingUpdates.style = styles.style
  if (styles.marginTop !== undefined) stylingUpdates.marginTop = styles.marginTop
  if (styles.marginRight !== undefined) stylingUpdates.marginRight = styles.marginRight
  if (styles.marginBottom !== undefined) stylingUpdates.marginBottom = styles.marginBottom
  if (styles.marginLeft !== undefined) stylingUpdates.marginLeft = styles.marginLeft
  
  // Type-specific properties (only apply to compatible chart types)
  if (chartType === 'bar' || chartType === 'horizontal-bar') {
    if (styles.groupMode !== undefined) stylingUpdates.groupMode = styles.groupMode
    if (styles.layout !== undefined) stylingUpdates.layout = styles.layout
    if (styles.padding !== undefined) stylingUpdates.padding = styles.padding
    if (styles.innerPadding !== undefined) stylingUpdates.innerPadding = styles.innerPadding
    if (styles.xAxisTitle !== undefined) stylingUpdates.xAxisTitle = styles.xAxisTitle
    if (styles.yAxisTitle !== undefined) stylingUpdates.yAxisTitle = styles.yAxisTitle
    if (styles.enableLabel !== undefined) stylingUpdates.enableLabel = styles.enableLabel
    if (styles.labelPosition !== undefined) stylingUpdates.labelPosition = styles.labelPosition
    if (styles.labelSkipWidth !== undefined) stylingUpdates.labelSkipWidth = styles.labelSkipWidth
    if (styles.labelSkipHeight !== undefined) stylingUpdates.labelSkipHeight = styles.labelSkipHeight
    if (styles.labelTextColor !== undefined) stylingUpdates.labelTextColor = styles.labelTextColor
    if (styles.labelFormat !== undefined) stylingUpdates.labelFormat = styles.labelFormat
    if (styles.labelOffset !== undefined) stylingUpdates.labelOffset = styles.labelOffset
    if (styles.xAxisLegend !== undefined) stylingUpdates.xAxisLegend = styles.xAxisLegend
    if (styles.xAxisLegendPosition !== undefined) stylingUpdates.xAxisLegendPosition = styles.xAxisLegendPosition
    if (styles.xAxisLegendOffset !== undefined) stylingUpdates.xAxisLegendOffset = styles.xAxisLegendOffset
    if (styles.xAxisTickRotation !== undefined) stylingUpdates.xAxisTickRotation = styles.xAxisTickRotation
    if (styles.xAxisTickSize !== undefined) stylingUpdates.xAxisTickSize = styles.xAxisTickSize
    if (styles.xAxisTickPadding !== undefined) stylingUpdates.xAxisTickPadding = styles.xAxisTickPadding
    if (styles.yAxisLegend !== undefined) stylingUpdates.yAxisLegend = styles.yAxisLegend
    if (styles.yAxisLegendOffset !== undefined) stylingUpdates.yAxisLegendOffset = styles.yAxisLegendOffset
    if (styles.yAxisTickRotation !== undefined) stylingUpdates.yAxisTickRotation = styles.yAxisTickRotation
    if (styles.yAxisTickSize !== undefined) stylingUpdates.yAxisTickSize = styles.yAxisTickSize
    if (styles.yAxisTickPadding !== undefined) stylingUpdates.yAxisTickPadding = styles.yAxisTickPadding
  }
  
  if (chartType === 'pie') {
    if (styles.innerRadius !== undefined) stylingUpdates.innerRadius = styles.innerRadius
    if (styles.outerRadius !== undefined) stylingUpdates.outerRadius = styles.outerRadius
    if (styles.padAngle !== undefined) stylingUpdates.padAngle = styles.padAngle
    if (styles.cornerRadius !== undefined) stylingUpdates.cornerRadius = styles.cornerRadius
    if (styles.activeOuterRadiusOffset !== undefined) stylingUpdates.activeOuterRadiusOffset = styles.activeOuterRadiusOffset
    if (styles.enableLabels !== undefined) stylingUpdates.enableLabels = styles.enableLabels
    if (styles.enableArcLabels !== undefined) stylingUpdates.enableArcLabels = styles.enableArcLabels
    if (styles.enableArcLinkLabels !== undefined) stylingUpdates.enableArcLinkLabels = styles.enableArcLinkLabels
    if (styles.arcLabelsSkipAngle !== undefined) stylingUpdates.arcLabelsSkipAngle = styles.arcLabelsSkipAngle
    if (styles.arcLabelsTextColor !== undefined) stylingUpdates.arcLabelsTextColor = styles.arcLabelsTextColor
    if (styles.arcLinkLabelsSkipAngle !== undefined) stylingUpdates.arcLinkLabelsSkipAngle = styles.arcLinkLabelsSkipAngle
    if (styles.arcLinkLabelsTextColor !== undefined) stylingUpdates.arcLinkLabelsTextColor = styles.arcLinkLabelsTextColor
  }
  
  if (chartType === 'line') {
    if (styles.enableDots !== undefined) stylingUpdates.enableDots = styles.enableDots
    if (styles.dotSize !== undefined) stylingUpdates.dotSize = styles.dotSize
    if (styles.enableArea !== undefined) stylingUpdates.enableArea = styles.enableArea
    if (styles.areaOpacity !== undefined) stylingUpdates.areaOpacity = styles.areaOpacity
    if (styles.lineWidth !== undefined) stylingUpdates.lineWidth = styles.lineWidth
    if (styles.enableSlices !== undefined) stylingUpdates.enableSlices = styles.enableSlices
  }
  
  if (chartType === 'area') {
    if (styles.enableStacking !== undefined) stylingUpdates.enableStacking = styles.enableStacking
    if (styles.areaBaselineValue !== undefined) stylingUpdates.areaBaselineValue = styles.areaBaselineValue
  }
  
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

// Helper function to check compatibility between chart types
export function getChartCompatibilityInfo(sourceType: ChartStyleClipboard['sourceWidgetType'], targetType: ChartStyleClipboard['sourceWidgetType'], styles: CommonChartStyles) {
  let totalProps = 0
  let compatibleProps = 0
  let specificProps = 0
  let compatibleSpecificProps = 0
  
  // Count all defined properties
  Object.keys(styles).forEach(key => {
    const value = styles[key as keyof CommonChartStyles]
    if (value !== undefined && value !== null) {
      totalProps++
      
      // Common properties (always compatible)
      const commonProperties = [
        'axisFontFamily', 'axisFontSize', 'axisFontWeight', 'axisTextColor',
        'axisLegendFontSize', 'axisLegendFontWeight', 'labelsFontFamily', 'labelsFontSize',
        'labelsFontWeight', 'labelsTextColor', 'legendsFontFamily', 'legendsFontSize',
        'legendsFontWeight', 'legendsTextColor', 'tooltipFontSize', 'tooltipFontFamily',
        'containerBorderWidth', 'containerBorderColor', 'containerBorderRadius', 'containerPadding',
        'containerShadowColor', 'containerShadowOpacity', 'containerShadowBlur', 'containerShadowOffsetX',
        'containerShadowOffsetY', 'colors', 'borderRadius', 'borderWidth', 'borderColor',
        'showLegend', 'showGrid', 'enableGridX', 'enableGridY', 'legendPosition', 
        'legendDirection', 'legendSpacing', 'legendSymbolSize', 'legendSymbolShape',
        'title', 'style', 'marginTop', 'marginRight', 'marginBottom', 'marginLeft'
      ]
      
      if (commonProperties.includes(key)) {
        compatibleProps++
      } else {
        // This is a specific property
        specificProps++
        
        // Check if specific property is compatible
        const sourceChartType = sourceType.replace('chart-', '') as 'bar' | 'line' | 'pie' | 'area' | 'horizontal-bar'
        const targetChartType = targetType.replace('chart-', '') as 'bar' | 'line' | 'pie' | 'area' | 'horizontal-bar'
        
        // Bar chart specific properties
        const barProperties = [
          'groupMode', 'layout', 'padding', 'innerPadding', 'xAxisTitle', 'yAxisTitle',
          'enableLabel', 'labelPosition', 'labelSkipWidth', 'labelSkipHeight', 'labelTextColor',
          'labelFormat', 'labelOffset', 'xAxisLegend', 'xAxisLegendPosition', 'xAxisLegendOffset',
          'xAxisTickRotation', 'xAxisTickSize', 'xAxisTickPadding', 'yAxisLegend', 'yAxisLegendOffset',
          'yAxisTickRotation', 'yAxisTickSize', 'yAxisTickPadding'
        ]
        
        // Pie chart specific properties
        const pieProperties = [
          'innerRadius', 'outerRadius', 'padAngle', 'cornerRadius', 'activeOuterRadiusOffset',
          'enableLabels', 'enableArcLabels', 'enableArcLinkLabels', 'arcLabelsSkipAngle',
          'arcLabelsTextColor', 'arcLinkLabelsSkipAngle', 'arcLinkLabelsTextColor'
        ]
        
        // Line chart specific properties
        const lineProperties = [
          'enableDots', 'dotSize', 'enableArea', 'areaOpacity', 'lineWidth', 'enableSlices'
        ]
        
        // Area chart specific properties
        const areaProperties = [
          'enableStacking', 'areaBaselineValue'
        ]
        
        // Check compatibility
        if ((barProperties.includes(key) && (targetChartType === 'bar' || targetChartType === 'horizontal-bar')) ||
            (pieProperties.includes(key) && targetChartType === 'pie') ||
            (lineProperties.includes(key) && targetChartType === 'line') ||
            (areaProperties.includes(key) && targetChartType === 'area')) {
          compatibleSpecificProps++
        }
      }
    }
  })
  
  const totalCompatible = compatibleProps + compatibleSpecificProps
  const isFullyCompatible = sourceType === targetType
  const compatibilityPercentage = totalProps > 0 ? Math.round((totalCompatible / totalProps) * 100) : 100
  
  return {
    totalProps,
    compatibleProps,
    specificProps,
    compatibleSpecificProps,
    totalCompatible,
    isFullyCompatible,
    compatibilityPercentage
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