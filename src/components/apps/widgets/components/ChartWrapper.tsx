'use client'

import { useState, useEffect } from 'react'
import { BarChart } from '@/components/charts'
import { LineChart } from '@/components/charts'
import { PieChart } from '@/components/charts'
import { AreaChart } from '@/components/charts'
import type { ChartData } from '@/components/charts/types'
import type { DroppedWidget } from '@/types/apps/droppedWidget'

interface ChartWrapperProps {
  widget: DroppedWidget
}

export default function ChartWrapper({ widget }: ChartWrapperProps) {
  const [data, setData] = useState<ChartData[]>([])

  useEffect(() => {
    // Determine chart type and config based on widget type
    let chartConfig
    let chartType
    
    if (widget.type === 'chart-bar' && widget.barChartConfig) {
      chartConfig = widget.barChartConfig
      chartType = 'bar'
    } else if (widget.type === 'chart-horizontal-bar' && widget.horizontalBarChartConfig) {
      chartConfig = widget.horizontalBarChartConfig
      chartType = 'horizontal-bar'
    } else if (widget.type === 'chart-line' && widget.lineChartConfig) {
      chartConfig = widget.lineChartConfig
      chartType = 'line'
    } else if (widget.type === 'chart-pie' && widget.pieChartConfig) {
      chartConfig = widget.pieChartConfig
      chartType = 'pie'
    } else if (widget.type === 'chart-area' && widget.areaChartConfig) {
      chartConfig = widget.areaChartConfig
      chartType = 'area'
    } else {
      // Fallback: try to detect from available configs or use bar as default
      chartConfig = widget.barChartConfig || widget.horizontalBarChartConfig || widget.lineChartConfig || widget.pieChartConfig || widget.areaChartConfig
      chartType = 'bar' // Default to bar chart
    }
    
    console.log('🐛 DEBUG - ChartWrapper (DIRECT):', {
      widgetId: widget.i,
      widgetType: widget.type,
      chartType,
      hasChartConfig: !!chartConfig,
      hasBigQueryData: !!chartConfig?.bigqueryData,
      hasData: !!chartConfig?.bigqueryData?.data,
      dataType: typeof chartConfig?.bigqueryData?.data,
      dataLength: Array.isArray(chartConfig?.bigqueryData?.data) ? chartConfig.bigqueryData.data.length : 'not array',
      dataSample: chartConfig?.bigqueryData?.data,
      xAxisField: chartConfig?.bigqueryData?.columns?.xAxis?.[0]?.name,
      yAxisField: chartConfig?.bigqueryData?.columns?.yAxis?.[0]?.name,
      directAccess: true
    })
    
    if (chartConfig?.bigqueryData?.data && Array.isArray(chartConfig.bigqueryData.data)) {
      // Use real BigQuery data from chartStore
      const bigqueryData = chartConfig.bigqueryData.data
      const xAxisField = chartConfig.bigqueryData.columns.xAxis[0]?.name
      const yAxisField = chartConfig.bigqueryData.columns.yAxis[0]?.name
      
      if (xAxisField && yAxisField) {
        const chartData = bigqueryData.map((item: Record<string, unknown>) => ({
          x: String(item[xAxisField] || ''),
          y: Number(item[yAxisField] || 0),
          label: String(item[xAxisField] || ''),
          value: Number(item[yAxisField] || 0)
        }))
        
        setData(chartData)
        console.log(`📊 ChartWrapper (${chartType}) usando dados reais do store:`, chartData)
      } else {
        console.log(`🐛 ChartWrapper (${chartType}): Campos xAxis/yAxis não encontrados`)
        setData([])
      }
    } else {
      // Fallback to empty data
      setData([])
      console.log(`📊 ChartWrapper (${chartType}): Nenhum dado disponível`)
    }
  }, [widget.barChartConfig, widget.horizontalBarChartConfig, widget.lineChartConfig, widget.pieChartConfig, widget.areaChartConfig, widget.type])

  // Render the appropriate chart based on widget type
  const renderChart = () => {
    const colors = widget.barChartConfig?.styling?.colors || 
                  widget.horizontalBarChartConfig?.styling?.colors ||
                  widget.lineChartConfig?.styling?.colors || 
                  widget.pieChartConfig?.styling?.colors || 
                  widget.areaChartConfig?.styling?.colors || 
                  ['#2563eb']
                  
    const showGrid = widget.barChartConfig?.styling?.showGrid ?? 
                    widget.horizontalBarChartConfig?.styling?.showGrid ??
                    widget.lineChartConfig?.styling?.showGrid ?? 
                    widget.pieChartConfig?.styling?.showGrid ?? 
                    widget.areaChartConfig?.styling?.showGrid ?? 
                    true

    // Labels properties
    const enableLabel = widget.barChartConfig?.styling?.enableLabel ?? 
                       widget.horizontalBarChartConfig?.styling?.enableLabel ?? 
                       false

    const labelPosition = widget.barChartConfig?.styling?.labelPosition ?? 
                         widget.horizontalBarChartConfig?.styling?.labelPosition ?? 
                         'middle'

    const labelSkipWidth = widget.barChartConfig?.styling?.labelSkipWidth ?? 
                          widget.horizontalBarChartConfig?.styling?.labelSkipWidth ?? 
                          0

    const labelSkipHeight = widget.barChartConfig?.styling?.labelSkipHeight ?? 
                           widget.horizontalBarChartConfig?.styling?.labelSkipHeight ?? 
                           0

    const labelTextColor = widget.barChartConfig?.styling?.labelTextColor ?? 
                          widget.horizontalBarChartConfig?.styling?.labelTextColor ?? 
                          widget.lineChartConfig?.styling?.pointLabelTextColor ??
                          widget.areaChartConfig?.styling?.pointLabelTextColor ??
                          '#374151'

    // Pie chart labels
    const enableArcLabels = widget.pieChartConfig?.styling?.enableArcLabels ?? true
    const enableArcLinkLabels = widget.pieChartConfig?.styling?.enableArcLinkLabels ?? false
    const arcLabelsSkipAngle = widget.pieChartConfig?.styling?.arcLabelsSkipAngle ?? 15
    const arcLabelsTextColor = widget.pieChartConfig?.styling?.arcLabelsTextColor
    const arcLinkLabelsSkipAngle = widget.pieChartConfig?.styling?.arcLinkLabelsSkipAngle ?? 10
    const arcLinkLabelsTextColor = widget.pieChartConfig?.styling?.arcLinkLabelsTextColor

    // Point labels for line/area charts
    const enablePointLabels = widget.lineChartConfig?.styling?.enablePointLabels ?? 
                             widget.areaChartConfig?.styling?.enablePointLabels ?? 
                             false

    // Margin properties
    const marginTop = widget.barChartConfig?.styling?.marginTop ??
                     widget.horizontalBarChartConfig?.styling?.marginTop ??
                     widget.lineChartConfig?.styling?.marginTop ??
                     widget.pieChartConfig?.styling?.marginTop ??
                     widget.areaChartConfig?.styling?.marginTop ??
                     12

    const marginRight = widget.barChartConfig?.styling?.marginRight ??
                       widget.horizontalBarChartConfig?.styling?.marginRight ??
                       widget.lineChartConfig?.styling?.marginRight ??
                       widget.pieChartConfig?.styling?.marginRight ??
                       widget.areaChartConfig?.styling?.marginRight ??
                       12

    const marginBottom = widget.barChartConfig?.styling?.marginBottom ??
                        widget.horizontalBarChartConfig?.styling?.marginBottom ??
                        widget.lineChartConfig?.styling?.marginBottom ??
                        widget.pieChartConfig?.styling?.marginBottom ??
                        widget.areaChartConfig?.styling?.marginBottom ??
                        60

    const marginLeft = widget.barChartConfig?.styling?.marginLeft ??
                      widget.horizontalBarChartConfig?.styling?.marginLeft ??
                      widget.lineChartConfig?.styling?.marginLeft ??
                      widget.pieChartConfig?.styling?.marginLeft ??
                      widget.areaChartConfig?.styling?.marginLeft ??
                      75

    // Pie chart specific margin defaults
    const pieMarginTop = widget.pieChartConfig?.styling?.marginTop ?? 20
    const pieMarginRight = widget.pieChartConfig?.styling?.marginRight ?? 20
    const pieMarginBottom = widget.pieChartConfig?.styling?.marginBottom ?? 80
    const pieMarginLeft = widget.pieChartConfig?.styling?.marginLeft ?? 20

    // Axes properties
    const xAxisLegend = widget.barChartConfig?.styling?.xAxisLegend ??
                      widget.horizontalBarChartConfig?.styling?.xAxisLegend ??
                      widget.lineChartConfig?.styling?.xAxisLegend ??
                      widget.areaChartConfig?.styling?.xAxisLegend

    const xAxisLegendPosition = widget.barChartConfig?.styling?.xAxisLegendPosition ??
                              widget.horizontalBarChartConfig?.styling?.xAxisLegendPosition ??
                              widget.lineChartConfig?.styling?.xAxisLegendPosition ??
                              widget.areaChartConfig?.styling?.xAxisLegendPosition ??
                              'middle'

    const xAxisLegendOffset = widget.barChartConfig?.styling?.xAxisLegendOffset ??
                            widget.horizontalBarChartConfig?.styling?.xAxisLegendOffset ??
                            widget.lineChartConfig?.styling?.xAxisLegendOffset ??
                            widget.areaChartConfig?.styling?.xAxisLegendOffset ??
                            46

    const xAxisTickRotation = widget.barChartConfig?.styling?.xAxisTickRotation ??
                            widget.horizontalBarChartConfig?.styling?.xAxisTickRotation ??
                            widget.lineChartConfig?.styling?.xAxisTickRotation ??
                            widget.areaChartConfig?.styling?.xAxisTickRotation ??
                            0

    const xAxisTickSize = widget.barChartConfig?.styling?.xAxisTickSize ??
                        widget.horizontalBarChartConfig?.styling?.xAxisTickSize ??
                        widget.lineChartConfig?.styling?.xAxisTickSize ??
                        widget.areaChartConfig?.styling?.xAxisTickSize ??
                        0

    const xAxisTickPadding = widget.barChartConfig?.styling?.xAxisTickPadding ??
                           widget.horizontalBarChartConfig?.styling?.xAxisTickPadding ??
                           widget.lineChartConfig?.styling?.xAxisTickPadding ??
                           widget.areaChartConfig?.styling?.xAxisTickPadding ??
                           8

    const yAxisLegend = widget.barChartConfig?.styling?.yAxisLegend ??
                      widget.horizontalBarChartConfig?.styling?.yAxisLegend ??
                      widget.lineChartConfig?.styling?.yAxisLegend ??
                      widget.areaChartConfig?.styling?.yAxisLegend

    const yAxisLegendOffset = widget.barChartConfig?.styling?.yAxisLegendOffset ??
                            widget.horizontalBarChartConfig?.styling?.yAxisLegendOffset ??
                            widget.lineChartConfig?.styling?.yAxisLegendOffset ??
                            widget.areaChartConfig?.styling?.yAxisLegendOffset ??
                            -40

    const yAxisTickRotation = widget.barChartConfig?.styling?.yAxisTickRotation ??
                            widget.horizontalBarChartConfig?.styling?.yAxisTickRotation ??
                            widget.lineChartConfig?.styling?.yAxisTickRotation ??
                            widget.areaChartConfig?.styling?.yAxisTickRotation ??
                            0

    const yAxisTickSize = widget.barChartConfig?.styling?.yAxisTickSize ??
                        widget.horizontalBarChartConfig?.styling?.yAxisTickSize ??
                        widget.lineChartConfig?.styling?.yAxisTickSize ??
                        widget.areaChartConfig?.styling?.yAxisTickSize ??
                        0

    const yAxisTickPadding = widget.barChartConfig?.styling?.yAxisTickPadding ??
                           widget.horizontalBarChartConfig?.styling?.yAxisTickPadding ??
                           widget.lineChartConfig?.styling?.yAxisTickPadding ??
                           widget.areaChartConfig?.styling?.yAxisTickPadding ??
                           8
                    
    const title = widget.barChartConfig?.styling?.title ||
                 widget.horizontalBarChartConfig?.styling?.title ||
                 widget.lineChartConfig?.styling?.title ||
                 widget.pieChartConfig?.styling?.title ||
                 widget.areaChartConfig?.styling?.title

    // Title/Subtitle spacing props
    const titleMarginTop = widget.barChartConfig?.styling?.titleMarginTop ??
                          widget.lineChartConfig?.styling?.titleMarginTop ??
                          widget.pieChartConfig?.styling?.titleMarginTop ??
                          widget.areaChartConfig?.styling?.titleMarginTop ??
                          widget.horizontalBarChartConfig?.styling?.titleMarginTop

    const titleMarginRight = widget.barChartConfig?.styling?.titleMarginRight ??
                            widget.lineChartConfig?.styling?.titleMarginRight ??
                            widget.pieChartConfig?.styling?.titleMarginRight ??
                            widget.areaChartConfig?.styling?.titleMarginRight ??
                            widget.horizontalBarChartConfig?.styling?.titleMarginRight

    const titleMarginBottom = widget.barChartConfig?.styling?.titleMarginBottom ??
                             widget.lineChartConfig?.styling?.titleMarginBottom ??
                             widget.pieChartConfig?.styling?.titleMarginBottom ??
                             widget.areaChartConfig?.styling?.titleMarginBottom ??
                             widget.horizontalBarChartConfig?.styling?.titleMarginBottom

    const titleMarginLeft = widget.barChartConfig?.styling?.titleMarginLeft ??
                           widget.lineChartConfig?.styling?.titleMarginLeft ??
                           widget.pieChartConfig?.styling?.titleMarginLeft ??
                           widget.areaChartConfig?.styling?.titleMarginLeft ??
                           widget.horizontalBarChartConfig?.styling?.titleMarginLeft

    const titlePaddingTop = widget.barChartConfig?.styling?.titlePaddingTop ??
                           widget.lineChartConfig?.styling?.titlePaddingTop ??
                           widget.pieChartConfig?.styling?.titlePaddingTop ??
                           widget.areaChartConfig?.styling?.titlePaddingTop ??
                           widget.horizontalBarChartConfig?.styling?.titlePaddingTop

    const titlePaddingRight = widget.barChartConfig?.styling?.titlePaddingRight ??
                             widget.lineChartConfig?.styling?.titlePaddingRight ??
                             widget.pieChartConfig?.styling?.titlePaddingRight ??
                             widget.areaChartConfig?.styling?.titlePaddingRight ??
                             widget.horizontalBarChartConfig?.styling?.titlePaddingRight

    const titlePaddingBottom = widget.barChartConfig?.styling?.titlePaddingBottom ??
                              widget.lineChartConfig?.styling?.titlePaddingBottom ??
                              widget.pieChartConfig?.styling?.titlePaddingBottom ??
                              widget.areaChartConfig?.styling?.titlePaddingBottom ??
                              widget.horizontalBarChartConfig?.styling?.titlePaddingBottom

    const titlePaddingLeft = widget.barChartConfig?.styling?.titlePaddingLeft ??
                            widget.lineChartConfig?.styling?.titlePaddingLeft ??
                            widget.pieChartConfig?.styling?.titlePaddingLeft ??
                            widget.areaChartConfig?.styling?.titlePaddingLeft ??
                            widget.horizontalBarChartConfig?.styling?.titlePaddingLeft

    const subtitleMarginTop = widget.barChartConfig?.styling?.subtitleMarginTop ??
                             widget.lineChartConfig?.styling?.subtitleMarginTop ??
                             widget.pieChartConfig?.styling?.subtitleMarginTop ??
                             widget.areaChartConfig?.styling?.subtitleMarginTop ??
                             widget.horizontalBarChartConfig?.styling?.subtitleMarginTop

    const subtitleMarginRight = widget.barChartConfig?.styling?.subtitleMarginRight ??
                               widget.lineChartConfig?.styling?.subtitleMarginRight ??
                               widget.pieChartConfig?.styling?.subtitleMarginRight ??
                               widget.areaChartConfig?.styling?.subtitleMarginRight ??
                               widget.horizontalBarChartConfig?.styling?.subtitleMarginRight

    const subtitleMarginBottom = widget.barChartConfig?.styling?.subtitleMarginBottom ??
                                widget.lineChartConfig?.styling?.subtitleMarginBottom ??
                                widget.pieChartConfig?.styling?.subtitleMarginBottom ??
                                widget.areaChartConfig?.styling?.subtitleMarginBottom ??
                                widget.horizontalBarChartConfig?.styling?.subtitleMarginBottom

    const subtitleMarginLeft = widget.barChartConfig?.styling?.subtitleMarginLeft ??
                              widget.lineChartConfig?.styling?.subtitleMarginLeft ??
                              widget.pieChartConfig?.styling?.subtitleMarginLeft ??
                              widget.areaChartConfig?.styling?.subtitleMarginLeft ??
                              widget.horizontalBarChartConfig?.styling?.subtitleMarginLeft

    const subtitlePaddingTop = widget.barChartConfig?.styling?.subtitlePaddingTop ??
                              widget.lineChartConfig?.styling?.subtitlePaddingTop ??
                              widget.pieChartConfig?.styling?.subtitlePaddingTop ??
                              widget.areaChartConfig?.styling?.subtitlePaddingTop ??
                              widget.horizontalBarChartConfig?.styling?.subtitlePaddingTop

    const subtitlePaddingRight = widget.barChartConfig?.styling?.subtitlePaddingRight ??
                                widget.lineChartConfig?.styling?.subtitlePaddingRight ??
                                widget.pieChartConfig?.styling?.subtitlePaddingRight ??
                                widget.areaChartConfig?.styling?.subtitlePaddingRight ??
                                widget.horizontalBarChartConfig?.styling?.subtitlePaddingRight

    const subtitlePaddingBottom = widget.barChartConfig?.styling?.subtitlePaddingBottom ??
                                 widget.lineChartConfig?.styling?.subtitlePaddingBottom ??
                                 widget.pieChartConfig?.styling?.subtitlePaddingBottom ??
                                 widget.areaChartConfig?.styling?.subtitlePaddingBottom ??
                                 widget.horizontalBarChartConfig?.styling?.subtitlePaddingBottom

    const subtitlePaddingLeft = widget.barChartConfig?.styling?.subtitlePaddingLeft ??
                               widget.lineChartConfig?.styling?.subtitlePaddingLeft ??
                               widget.pieChartConfig?.styling?.subtitlePaddingLeft ??
                               widget.areaChartConfig?.styling?.subtitlePaddingLeft ??
                               widget.horizontalBarChartConfig?.styling?.subtitlePaddingLeft

    const titleClassName = widget.barChartConfig?.styling?.titleClassName ||
                          widget.lineChartConfig?.styling?.titleClassName ||
                          widget.pieChartConfig?.styling?.titleClassName ||
                          widget.areaChartConfig?.styling?.titleClassName ||
                          widget.horizontalBarChartConfig?.styling?.titleClassName

    const subtitleClassName = widget.barChartConfig?.styling?.subtitleClassName ||
                             widget.lineChartConfig?.styling?.subtitleClassName ||
                             widget.pieChartConfig?.styling?.subtitleClassName ||
                             widget.areaChartConfig?.styling?.subtitleClassName ||
                             widget.horizontalBarChartConfig?.styling?.subtitleClassName

    // Typography props - Axis
    const axisFontFamily = widget.barChartConfig?.styling?.axisFontFamily ??
                          widget.horizontalBarChartConfig?.styling?.axisFontFamily ??
                          widget.lineChartConfig?.styling?.axisFontFamily ??
                          widget.areaChartConfig?.styling?.axisFontFamily

    const axisFontSize = widget.barChartConfig?.styling?.axisFontSize ??
                        widget.horizontalBarChartConfig?.styling?.axisFontSize ??
                        widget.lineChartConfig?.styling?.axisFontSize ??
                        widget.areaChartConfig?.styling?.axisFontSize

    const axisFontWeight = widget.barChartConfig?.styling?.axisFontWeight ??
                          widget.horizontalBarChartConfig?.styling?.axisFontWeight ??
                          widget.lineChartConfig?.styling?.axisFontWeight ??
                          widget.areaChartConfig?.styling?.axisFontWeight

    const axisTextColor = widget.barChartConfig?.styling?.axisTextColor ??
                         widget.horizontalBarChartConfig?.styling?.axisTextColor ??
                         widget.lineChartConfig?.styling?.axisTextColor ??
                         widget.areaChartConfig?.styling?.axisTextColor

    const axisLegendFontSize = widget.barChartConfig?.styling?.axisLegendFontSize ??
                              widget.horizontalBarChartConfig?.styling?.axisLegendFontSize ??
                              widget.lineChartConfig?.styling?.axisLegendFontSize ??
                              widget.areaChartConfig?.styling?.axisLegendFontSize

    const axisLegendFontWeight = widget.barChartConfig?.styling?.axisLegendFontWeight ??
                                widget.horizontalBarChartConfig?.styling?.axisLegendFontWeight ??
                                widget.lineChartConfig?.styling?.axisLegendFontWeight ??
                                widget.areaChartConfig?.styling?.axisLegendFontWeight

    // Typography props - Labels  
    const labelsFontFamily = widget.barChartConfig?.styling?.labelsFontFamily ??
                            widget.horizontalBarChartConfig?.styling?.labelsFontFamily ??
                            widget.lineChartConfig?.styling?.labelsFontFamily ??
                            widget.areaChartConfig?.styling?.labelsFontFamily

    const labelsFontSize = widget.barChartConfig?.styling?.labelsFontSize ??
                          widget.horizontalBarChartConfig?.styling?.labelsFontSize ??
                          widget.lineChartConfig?.styling?.labelsFontSize ??
                          widget.areaChartConfig?.styling?.labelsFontSize

    const labelsFontWeight = widget.barChartConfig?.styling?.labelsFontWeight ??
                            widget.horizontalBarChartConfig?.styling?.labelsFontWeight ??
                            widget.lineChartConfig?.styling?.labelsFontWeight ??
                            widget.areaChartConfig?.styling?.labelsFontWeight

    const labelsTextColor = widget.barChartConfig?.styling?.labelsTextColor ??
                           widget.horizontalBarChartConfig?.styling?.labelsTextColor ??
                           widget.lineChartConfig?.styling?.labelsTextColor ??
                           widget.areaChartConfig?.styling?.labelsTextColor

    // Typography props - Legends
    const legendsFontFamily = widget.barChartConfig?.styling?.legendsFontFamily ??
                             widget.horizontalBarChartConfig?.styling?.legendsFontFamily ??
                             widget.lineChartConfig?.styling?.legendsFontFamily ??
                             widget.pieChartConfig?.styling?.legendsFontFamily ??
                             widget.areaChartConfig?.styling?.legendsFontFamily

    const legendsFontSize = widget.barChartConfig?.styling?.legendsFontSize ??
                           widget.horizontalBarChartConfig?.styling?.legendsFontSize ??
                           widget.lineChartConfig?.styling?.legendsFontSize ??
                           widget.pieChartConfig?.styling?.legendsFontSize ??
                           widget.areaChartConfig?.styling?.legendsFontSize

    const legendsFontWeight = widget.barChartConfig?.styling?.legendsFontWeight ??
                             widget.horizontalBarChartConfig?.styling?.legendsFontWeight ??
                             widget.lineChartConfig?.styling?.legendsFontWeight ??
                             widget.pieChartConfig?.styling?.legendsFontWeight ??
                             widget.areaChartConfig?.styling?.legendsFontWeight

    const legendsTextColor = widget.barChartConfig?.styling?.legendsTextColor ??
                            widget.horizontalBarChartConfig?.styling?.legendsTextColor ??
                            widget.lineChartConfig?.styling?.legendsTextColor ??
                            widget.pieChartConfig?.styling?.legendsTextColor ??
                            widget.areaChartConfig?.styling?.legendsTextColor

    // Typography props - Tooltip
    const tooltipFontSize = widget.barChartConfig?.styling?.tooltipFontSize ??
                           widget.horizontalBarChartConfig?.styling?.tooltipFontSize ??
                           widget.lineChartConfig?.styling?.tooltipFontSize ??
                           widget.pieChartConfig?.styling?.tooltipFontSize ??
                           widget.areaChartConfig?.styling?.tooltipFontSize

    const tooltipFontFamily = widget.barChartConfig?.styling?.tooltipFontFamily ??
                             widget.horizontalBarChartConfig?.styling?.tooltipFontFamily ??
                             widget.lineChartConfig?.styling?.tooltipFontFamily ??
                             widget.pieChartConfig?.styling?.tooltipFontFamily ??
                             widget.areaChartConfig?.styling?.tooltipFontFamily

    // Container Border props (bar chart, line chart, pie chart, area chart and horizontal bar chart)
    const containerBorderWidth = widget.barChartConfig?.styling?.containerBorderWidth ??
                                widget.lineChartConfig?.styling?.containerBorderWidth ??
                                widget.pieChartConfig?.styling?.containerBorderWidth ??
                                widget.areaChartConfig?.styling?.containerBorderWidth ??
                                widget.horizontalBarChartConfig?.styling?.containerBorderWidth
    
    const containerBorderColor = widget.barChartConfig?.styling?.containerBorderColor ??
                                widget.lineChartConfig?.styling?.containerBorderColor ??
                                widget.pieChartConfig?.styling?.containerBorderColor ??
                                widget.areaChartConfig?.styling?.containerBorderColor ??
                                widget.horizontalBarChartConfig?.styling?.containerBorderColor
    
    const containerBorderRadius = widget.barChartConfig?.styling?.containerBorderRadius ??
                                 widget.lineChartConfig?.styling?.containerBorderRadius ??
                                 widget.pieChartConfig?.styling?.containerBorderRadius ??
                                 widget.areaChartConfig?.styling?.containerBorderRadius ??
                                 widget.horizontalBarChartConfig?.styling?.containerBorderRadius

    const containerPadding = widget.barChartConfig?.styling?.containerPadding ??
                            widget.lineChartConfig?.styling?.containerPadding ??
                            widget.pieChartConfig?.styling?.containerPadding ??
                            widget.areaChartConfig?.styling?.containerPadding ??
                            widget.horizontalBarChartConfig?.styling?.containerPadding

    // Container Shadow props (bar chart, line chart, pie chart, area chart and horizontal bar chart)
    const containerShadowColor = widget.barChartConfig?.styling?.containerShadowColor ??
                                widget.lineChartConfig?.styling?.containerShadowColor ??
                                widget.pieChartConfig?.styling?.containerShadowColor ??
                                widget.areaChartConfig?.styling?.containerShadowColor ??
                                widget.horizontalBarChartConfig?.styling?.containerShadowColor
    
    const containerShadowOpacity = widget.barChartConfig?.styling?.containerShadowOpacity ??
                                  widget.lineChartConfig?.styling?.containerShadowOpacity ??
                                  widget.pieChartConfig?.styling?.containerShadowOpacity ??
                                  widget.areaChartConfig?.styling?.containerShadowOpacity ??
                                  widget.horizontalBarChartConfig?.styling?.containerShadowOpacity
    
    const containerShadowBlur = widget.barChartConfig?.styling?.containerShadowBlur ??
                               widget.lineChartConfig?.styling?.containerShadowBlur ??
                               widget.pieChartConfig?.styling?.containerShadowBlur ??
                               widget.areaChartConfig?.styling?.containerShadowBlur ??
                               widget.horizontalBarChartConfig?.styling?.containerShadowBlur
    
    const containerShadowOffsetX = widget.barChartConfig?.styling?.containerShadowOffsetX ??
                                  widget.lineChartConfig?.styling?.containerShadowOffsetX ??
                                  widget.pieChartConfig?.styling?.containerShadowOffsetX ??
                                  widget.areaChartConfig?.styling?.containerShadowOffsetX ??
                                  widget.horizontalBarChartConfig?.styling?.containerShadowOffsetX
    
    const containerShadowOffsetY = widget.barChartConfig?.styling?.containerShadowOffsetY ??
                                  widget.lineChartConfig?.styling?.containerShadowOffsetY ??
                                  widget.pieChartConfig?.styling?.containerShadowOffsetY ??
                                  widget.areaChartConfig?.styling?.containerShadowOffsetY ??
                                  widget.horizontalBarChartConfig?.styling?.containerShadowOffsetY

    const commonProps = {
      data,
      colors,
      title,
      margin: { top: marginTop, right: marginRight, bottom: marginBottom, left: marginLeft },
      animate: false
    }

    switch (widget.type) {
      case 'chart-bar':
        // Criar configuração de legend se showLegend estiver ativo
        const legendConfig = widget.barChartConfig?.styling?.showLegend ? {
          anchor: widget.barChartConfig?.styling?.legendPosition ?? 'bottom',
          direction: widget.barChartConfig?.styling?.legendDirection ?? 'row',
          itemsSpacing: widget.barChartConfig?.styling?.legendSpacing ?? 20,
          symbolSize: widget.barChartConfig?.styling?.legendSymbolSize ?? 12,
          symbolShape: widget.barChartConfig?.styling?.legendSymbolShape ?? 'circle'
        } : undefined

        return (
          <BarChart
            {...commonProps}
            enableGridX={widget.barChartConfig?.styling?.enableGridX ?? false}
            enableGridY={widget.barChartConfig?.styling?.enableGridY ?? showGrid}
            borderRadius={widget.barChartConfig?.styling?.borderRadius}
            borderWidth={widget.barChartConfig?.styling?.borderWidth}
            borderColor={widget.barChartConfig?.styling?.borderColor}
            enableLabel={enableLabel}
            labelPosition={labelPosition}
            labelSkipWidth={labelSkipWidth}
            labelSkipHeight={labelSkipHeight}
            labelTextColor={labelTextColor}
            groupMode={widget.barChartConfig?.styling?.groupMode}
            layout={widget.barChartConfig?.styling?.layout}
            padding={widget.barChartConfig?.styling?.padding}
            innerPadding={widget.barChartConfig?.styling?.innerPadding}
            axisBottom={xAxisLegend || xAxisTickRotation !== 0 || xAxisTickSize !== 0 || xAxisTickPadding !== 8 ? {
              legend: xAxisLegend,
              legendPosition: xAxisLegendPosition,
              legendOffset: xAxisLegendOffset,
              tickRotation: xAxisTickRotation,
              tickSize: xAxisTickSize,
              tickPadding: xAxisTickPadding
            } : undefined}
            axisLeft={yAxisLegend || yAxisTickRotation !== 0 || yAxisTickSize !== 0 || yAxisTickPadding !== 8 ? {
              legend: yAxisLegend,
              legendOffset: yAxisLegendOffset,
              tickRotation: yAxisTickRotation,
              tickSize: yAxisTickSize,
              tickPadding: yAxisTickPadding
            } : undefined}
            legends={legendConfig}
            // Typography props
            axisFontFamily={axisFontFamily}
            axisFontSize={axisFontSize}
            axisFontWeight={axisFontWeight}
            axisTextColor={axisTextColor}
            axisLegendFontSize={axisLegendFontSize}
            axisLegendFontWeight={axisLegendFontWeight}
            labelsFontFamily={labelsFontFamily}
            labelsFontSize={labelsFontSize}
            labelsFontWeight={labelsFontWeight}
            labelsTextColor={labelsTextColor}
            legendsFontFamily={legendsFontFamily}
            legendsFontSize={legendsFontSize}
            legendsFontWeight={legendsFontWeight}
            legendsTextColor={legendsTextColor}
            tooltipFontSize={tooltipFontSize}
            tooltipFontFamily={tooltipFontFamily}
            // Title/Subtitle spacing props
            titleMarginTop={titleMarginTop}
            titleMarginRight={titleMarginRight}
            titleMarginBottom={titleMarginBottom}
            titleMarginLeft={titleMarginLeft}
            titlePaddingTop={titlePaddingTop}
            titlePaddingRight={titlePaddingRight}
            titlePaddingBottom={titlePaddingBottom}
            titlePaddingLeft={titlePaddingLeft}
            subtitleMarginTop={subtitleMarginTop}
            subtitleMarginRight={subtitleMarginRight}
            subtitleMarginBottom={subtitleMarginBottom}
            subtitleMarginLeft={subtitleMarginLeft}
            subtitlePaddingTop={subtitlePaddingTop}
            subtitlePaddingRight={subtitlePaddingRight}
            subtitlePaddingBottom={subtitlePaddingBottom}
            subtitlePaddingLeft={subtitlePaddingLeft}
            titleClassName={titleClassName}
            subtitleClassName={subtitleClassName}
            containerBorderWidth={containerBorderWidth}
            containerBorderColor={containerBorderColor}
            containerBorderRadius={containerBorderRadius}
            containerPadding={containerPadding}
            containerShadowColor={containerShadowColor}
            containerShadowOpacity={containerShadowOpacity}
            containerShadowBlur={containerShadowBlur}
            containerShadowOffsetX={containerShadowOffsetX}
            containerShadowOffsetY={containerShadowOffsetY}
          />
        )
      case 'chart-line':
        // Criar configuração de legend se showLegend estiver ativo
        const lineChartLegendConfig = widget.lineChartConfig?.styling?.showLegend ? {
          anchor: widget.lineChartConfig?.styling?.legendPosition ?? 'bottom',
          direction: widget.lineChartConfig?.styling?.legendDirection ?? 'row',
          itemsSpacing: widget.lineChartConfig?.styling?.legendSpacing ?? 20,
          symbolSize: widget.lineChartConfig?.styling?.legendSymbolSize ?? 12,
          symbolShape: widget.lineChartConfig?.styling?.legendSymbolShape ?? 'circle'
        } : undefined

        return (
          <LineChart
            {...commonProps}
            enableGridX={widget.lineChartConfig?.styling?.enableGridX ?? false}
            enableGridY={widget.lineChartConfig?.styling?.enableGridY ?? showGrid}
            borderRadius={widget.lineChartConfig?.styling?.borderRadius}
            borderWidth={widget.lineChartConfig?.styling?.borderWidth}
            borderColor={widget.lineChartConfig?.styling?.borderColor}
            enablePointLabels={enablePointLabels}
            pointLabelTextColor={labelTextColor}
            lineWidth={widget.lineChartConfig?.styling?.lineWidth}
            enablePoints={widget.lineChartConfig?.styling?.enablePoints}
            pointSize={widget.lineChartConfig?.styling?.pointSize}
            curve={widget.lineChartConfig?.styling?.curve}
            enableArea={widget.lineChartConfig?.styling?.enableArea}
            areaOpacity={widget.lineChartConfig?.styling?.areaOpacity}
            axisBottom={xAxisLegend || xAxisTickRotation !== 0 || xAxisTickSize !== 0 || xAxisTickPadding !== 8 ? {
              legend: xAxisLegend,
              legendPosition: xAxisLegendPosition,
              legendOffset: xAxisLegendOffset,
              tickRotation: xAxisTickRotation,
              tickSize: xAxisTickSize,
              tickPadding: xAxisTickPadding
            } : undefined}
            axisLeft={yAxisLegend || yAxisTickRotation !== 0 || yAxisTickSize !== 0 || yAxisTickPadding !== 8 ? {
              legend: yAxisLegend,
              legendOffset: yAxisLegendOffset,
              tickRotation: yAxisTickRotation,
              tickSize: yAxisTickSize,
              tickPadding: yAxisTickPadding
            } : undefined}
            legends={lineChartLegendConfig}
            // Title/Subtitle spacing props
            titleMarginTop={titleMarginTop}
            titleMarginRight={titleMarginRight}
            titleMarginBottom={titleMarginBottom}
            titleMarginLeft={titleMarginLeft}
            titlePaddingTop={titlePaddingTop}
            titlePaddingRight={titlePaddingRight}
            titlePaddingBottom={titlePaddingBottom}
            titlePaddingLeft={titlePaddingLeft}
            subtitleMarginTop={subtitleMarginTop}
            subtitleMarginRight={subtitleMarginRight}
            subtitleMarginBottom={subtitleMarginBottom}
            subtitleMarginLeft={subtitleMarginLeft}
            subtitlePaddingTop={subtitlePaddingTop}
            subtitlePaddingRight={subtitlePaddingRight}
            subtitlePaddingBottom={subtitlePaddingBottom}
            subtitlePaddingLeft={subtitlePaddingLeft}
            titleClassName={titleClassName}
            subtitleClassName={subtitleClassName}
            containerBorderWidth={containerBorderWidth}
            containerBorderColor={containerBorderColor}
            containerBorderRadius={containerBorderRadius}
            containerPadding={containerPadding}
            containerShadowColor={containerShadowColor}
            containerShadowOpacity={containerShadowOpacity}
            containerShadowBlur={containerShadowBlur}
            containerShadowOffsetX={containerShadowOffsetX}
            containerShadowOffsetY={containerShadowOffsetY}
          />
        )
      case 'chart-pie':
        // Criar configuração de legend se showLegend estiver ativo
        const pieChartLegendConfig = widget.pieChartConfig?.styling?.showLegend ? {
          anchor: widget.pieChartConfig?.styling?.legendPosition ?? 'bottom',
          direction: widget.pieChartConfig?.styling?.legendDirection ?? 'row',
          itemsSpacing: widget.pieChartConfig?.styling?.legendSpacing ?? 20,
          symbolSize: widget.pieChartConfig?.styling?.legendSymbolSize ?? 12,
          symbolShape: widget.pieChartConfig?.styling?.legendSymbolShape ?? 'circle'
        } : undefined

        return (
          <PieChart 
            data={data}
            colors={colors}
            title={title}
            margin={{ top: pieMarginTop, right: pieMarginRight, bottom: pieMarginBottom, left: pieMarginLeft }}
            animate={false}
            innerRadius={widget.pieChartConfig?.styling?.innerRadius ?? 0.5}
            padAngle={widget.pieChartConfig?.styling?.padAngle ?? 1}
            cornerRadius={widget.pieChartConfig?.styling?.cornerRadius ?? 2}
            activeOuterRadiusOffset={widget.pieChartConfig?.styling?.activeOuterRadiusOffset ?? 4}
            borderWidth={widget.pieChartConfig?.styling?.borderWidth}
            borderColor={widget.pieChartConfig?.styling?.borderColor}
            enableArcLabels={enableArcLabels}
            enableArcLinkLabels={enableArcLinkLabels}
            arcLabelsSkipAngle={arcLabelsSkipAngle}
            arcLabelsTextColor={arcLabelsTextColor}
            arcLinkLabelsSkipAngle={arcLinkLabelsSkipAngle}
            arcLinkLabelsTextColor={arcLinkLabelsTextColor}
            legends={pieChartLegendConfig}
            // Title/Subtitle spacing props
            titleMarginTop={titleMarginTop}
            titleMarginRight={titleMarginRight}
            titleMarginBottom={titleMarginBottom}
            titleMarginLeft={titleMarginLeft}
            titlePaddingTop={titlePaddingTop}
            titlePaddingRight={titlePaddingRight}
            titlePaddingBottom={titlePaddingBottom}
            titlePaddingLeft={titlePaddingLeft}
            subtitleMarginTop={subtitleMarginTop}
            subtitleMarginRight={subtitleMarginRight}
            subtitleMarginBottom={subtitleMarginBottom}
            subtitleMarginLeft={subtitleMarginLeft}
            subtitlePaddingTop={subtitlePaddingTop}
            subtitlePaddingRight={subtitlePaddingRight}
            subtitlePaddingBottom={subtitlePaddingBottom}
            subtitlePaddingLeft={subtitlePaddingLeft}
            titleClassName={titleClassName}
            subtitleClassName={subtitleClassName}
            containerBorderWidth={containerBorderWidth}
            containerBorderColor={containerBorderColor}
            containerBorderRadius={containerBorderRadius}
            containerPadding={containerPadding}
            containerShadowColor={containerShadowColor}
            containerShadowOpacity={containerShadowOpacity}
            containerShadowBlur={containerShadowBlur}
            containerShadowOffsetX={containerShadowOffsetX}
            containerShadowOffsetY={containerShadowOffsetY}
          />
        )
      case 'chart-area':
        // Criar configuração de legend se showLegend estiver ativo
        const areaChartLegendConfig = widget.areaChartConfig?.styling?.showLegend ? {
          anchor: widget.areaChartConfig?.styling?.legendPosition ?? 'bottom',
          direction: widget.areaChartConfig?.styling?.legendDirection ?? 'row',
          itemsSpacing: widget.areaChartConfig?.styling?.legendSpacing ?? 20,
          symbolSize: widget.areaChartConfig?.styling?.legendSymbolSize ?? 12,
          symbolShape: widget.areaChartConfig?.styling?.legendSymbolShape ?? 'circle'
        } : undefined

        return (
          <AreaChart 
            {...commonProps}
            enableGridX={widget.areaChartConfig?.styling?.enableGridX ?? false}
            enableGridY={widget.areaChartConfig?.styling?.enableGridY ?? showGrid}
            areaOpacity={widget.areaChartConfig?.styling?.areaOpacity ?? 0.15}
            borderRadius={widget.areaChartConfig?.styling?.borderRadius}
            borderWidth={widget.areaChartConfig?.styling?.borderWidth}
            borderColor={widget.areaChartConfig?.styling?.borderColor}
            lineWidth={widget.areaChartConfig?.styling?.lineWidth}
            enablePoints={widget.areaChartConfig?.styling?.enablePoints}
            pointSize={widget.areaChartConfig?.styling?.pointSize}
            curve={widget.areaChartConfig?.styling?.curve ?? "cardinal"}
            enableArea={true}
            enablePointLabels={enablePointLabels}
            pointLabelTextColor={labelTextColor}
            axisBottom={xAxisLegend || xAxisTickRotation !== 0 || xAxisTickSize !== 0 || xAxisTickPadding !== 8 ? {
              legend: xAxisLegend,
              legendPosition: xAxisLegendPosition,
              legendOffset: xAxisLegendOffset,
              tickRotation: xAxisTickRotation,
              tickSize: xAxisTickSize,
              tickPadding: xAxisTickPadding
            } : undefined}
            axisLeft={yAxisLegend || yAxisTickRotation !== 0 || yAxisTickSize !== 0 || yAxisTickPadding !== 8 ? {
              legend: yAxisLegend,
              legendOffset: yAxisLegendOffset,
              tickRotation: yAxisTickRotation,
              tickSize: yAxisTickSize,
              tickPadding: yAxisTickPadding
            } : undefined}
            legends={areaChartLegendConfig}
            // Title/Subtitle spacing props
            titleMarginTop={titleMarginTop}
            titleMarginRight={titleMarginRight}
            titleMarginBottom={titleMarginBottom}
            titleMarginLeft={titleMarginLeft}
            titlePaddingTop={titlePaddingTop}
            titlePaddingRight={titlePaddingRight}
            titlePaddingBottom={titlePaddingBottom}
            titlePaddingLeft={titlePaddingLeft}
            subtitleMarginTop={subtitleMarginTop}
            subtitleMarginRight={subtitleMarginRight}
            subtitleMarginBottom={subtitleMarginBottom}
            subtitleMarginLeft={subtitleMarginLeft}
            subtitlePaddingTop={subtitlePaddingTop}
            subtitlePaddingRight={subtitlePaddingRight}
            subtitlePaddingBottom={subtitlePaddingBottom}
            subtitlePaddingLeft={subtitlePaddingLeft}
            titleClassName={titleClassName}
            subtitleClassName={subtitleClassName}
            containerBorderWidth={containerBorderWidth}
            containerBorderColor={containerBorderColor}
            containerBorderRadius={containerBorderRadius}
            containerPadding={containerPadding}
            containerShadowColor={containerShadowColor}
            containerShadowOpacity={containerShadowOpacity}
            containerShadowBlur={containerShadowBlur}
            containerShadowOffsetX={containerShadowOffsetX}
            containerShadowOffsetY={containerShadowOffsetY}
          />
        )
      case 'chart-horizontal-bar':
        // Criar configuração de legend se showLegend estiver ativo
        const horizontalBarChartLegendConfig = widget.horizontalBarChartConfig?.styling?.showLegend ? {
          anchor: widget.horizontalBarChartConfig?.styling?.legendPosition ?? 'bottom',
          direction: widget.horizontalBarChartConfig?.styling?.legendDirection ?? 'row',
          itemsSpacing: widget.horizontalBarChartConfig?.styling?.legendSpacing ?? 20,
          symbolSize: widget.horizontalBarChartConfig?.styling?.legendSymbolSize ?? 12,
          symbolShape: widget.horizontalBarChartConfig?.styling?.legendSymbolShape ?? 'circle'
        } : undefined

        return (
          <BarChart 
            {...commonProps}
            layout={widget.horizontalBarChartConfig?.styling?.layout ?? "horizontal"}
            enableGridX={widget.horizontalBarChartConfig?.styling?.enableGridX ?? showGrid}
            enableGridY={widget.horizontalBarChartConfig?.styling?.enableGridY ?? false}
            borderRadius={widget.horizontalBarChartConfig?.styling?.borderRadius}
            borderWidth={widget.horizontalBarChartConfig?.styling?.borderWidth}
            borderColor={widget.horizontalBarChartConfig?.styling?.borderColor}
            enableLabel={enableLabel}
            labelPosition={labelPosition}
            labelSkipWidth={labelSkipWidth}
            labelSkipHeight={labelSkipHeight}
            labelTextColor={labelTextColor}
            groupMode={widget.horizontalBarChartConfig?.styling?.groupMode}
            padding={widget.horizontalBarChartConfig?.styling?.padding}
            innerPadding={widget.horizontalBarChartConfig?.styling?.innerPadding}
            axisBottom={xAxisLegend || xAxisTickRotation !== 0 || xAxisTickSize !== 0 || xAxisTickPadding !== 8 ? {
              legend: xAxisLegend,
              legendPosition: xAxisLegendPosition,
              legendOffset: xAxisLegendOffset,
              tickRotation: xAxisTickRotation,
              tickSize: xAxisTickSize,
              tickPadding: xAxisTickPadding
            } : undefined}
            axisLeft={yAxisLegend || yAxisTickRotation !== 0 || yAxisTickSize !== 0 || yAxisTickPadding !== 8 ? {
              legend: yAxisLegend,
              legendOffset: yAxisLegendOffset,
              tickRotation: yAxisTickRotation,
              tickSize: yAxisTickSize,
              tickPadding: yAxisTickPadding
            } : undefined}
            legends={horizontalBarChartLegendConfig}
            // Title/Subtitle spacing props
            titleMarginTop={titleMarginTop}
            titleMarginRight={titleMarginRight}
            titleMarginBottom={titleMarginBottom}
            titleMarginLeft={titleMarginLeft}
            titlePaddingTop={titlePaddingTop}
            titlePaddingRight={titlePaddingRight}
            titlePaddingBottom={titlePaddingBottom}
            titlePaddingLeft={titlePaddingLeft}
            subtitleMarginTop={subtitleMarginTop}
            subtitleMarginRight={subtitleMarginRight}
            subtitleMarginBottom={subtitleMarginBottom}
            subtitleMarginLeft={subtitleMarginLeft}
            subtitlePaddingTop={subtitlePaddingTop}
            subtitlePaddingRight={subtitlePaddingRight}
            subtitlePaddingBottom={subtitlePaddingBottom}
            subtitlePaddingLeft={subtitlePaddingLeft}
            titleClassName={titleClassName}
            subtitleClassName={subtitleClassName}
            containerBorderWidth={containerBorderWidth}
            containerBorderColor={containerBorderColor}
            containerBorderRadius={containerBorderRadius}
            containerPadding={containerPadding}
            containerShadowColor={containerShadowColor}
            containerShadowOpacity={containerShadowOpacity}
            containerShadowBlur={containerShadowBlur}
            containerShadowOffsetX={containerShadowOffsetX}
            containerShadowOffsetY={containerShadowOffsetY}
          />
        )
      default:
        // Default to bar chart
        return (
          <BarChart 
            {...commonProps}
            enableGridX={false}
            enableGridY={showGrid}
          />
        )
    }
  }

  return (
    <div className="h-full w-full">
      {renderChart()}
    </div>
  )
}