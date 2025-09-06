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
                    
    const title = widget.barChartConfig?.styling?.title || 
                 widget.horizontalBarChartConfig?.styling?.title ||
                 widget.lineChartConfig?.styling?.title ||
                 widget.pieChartConfig?.styling?.title ||
                 widget.areaChartConfig?.styling?.title

    const commonProps = {
      data,
      colors,
      title,
      margin: { top: 12, right: 12, bottom: 60, left: 50 },
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
            legends={legendConfig}
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
            legends={lineChartLegendConfig}
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
            {...commonProps}
            innerRadius={(widget.pieChartConfig?.styling?.innerRadius ?? 0) / 100}
            padAngle={1}
            cornerRadius={2}
            activeOuterRadiusOffset={4}
            enableArcLinkLabels={widget.pieChartConfig?.styling?.enableLabels !== false}
            arcLabelsSkipAngle={15}
            legends={pieChartLegendConfig}
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
            areaOpacity={widget.areaChartConfig?.styling?.areaOpacity ?? 0.4}
            curve="cardinal"
            enableArea={true}
            legends={areaChartLegendConfig}
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
            layout="horizontal"
            enableGridX={widget.horizontalBarChartConfig?.styling?.enableGridX ?? showGrid}
            enableGridY={widget.horizontalBarChartConfig?.styling?.enableGridY ?? false}
            borderRadius={widget.horizontalBarChartConfig?.styling?.borderRadius}
            borderWidth={widget.horizontalBarChartConfig?.styling?.borderWidth}
            borderColor={widget.horizontalBarChartConfig?.styling?.borderColor}
            legends={horizontalBarChartLegendConfig}
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