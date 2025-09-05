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
      chartConfig = widget.barChartConfig || widget.lineChartConfig || widget.pieChartConfig || widget.areaChartConfig
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
  }, [widget.barChartConfig, widget.lineChartConfig, widget.pieChartConfig, widget.areaChartConfig, widget.type])

  // Render the appropriate chart based on widget type
  const renderChart = () => {
    const colors = widget.barChartConfig?.styling?.colors || 
                  widget.lineChartConfig?.styling?.colors || 
                  widget.pieChartConfig?.styling?.colors || 
                  widget.areaChartConfig?.styling?.colors || 
                  ['#2563eb']
                  
    const showGrid = widget.barChartConfig?.styling?.showGrid ?? 
                    widget.lineChartConfig?.styling?.showGrid ?? 
                    widget.pieChartConfig?.styling?.showGrid ?? 
                    widget.areaChartConfig?.styling?.showGrid ?? 
                    true
                    
    const title = widget.barChartConfig?.styling?.title || 
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
        return (
          <BarChart 
            {...commonProps}
            enableGridX={widget.barChartConfig?.styling?.enableGridX ?? false}
            enableGridY={widget.barChartConfig?.styling?.enableGridY ?? showGrid}
          />
        )
      case 'chart-line':
        return (
          <LineChart 
            {...commonProps}
            enableGridX={false}
            enableGridY={showGrid}
          />
        )
      case 'chart-pie':
        return (
          <PieChart 
            {...commonProps}
            innerRadius={0.5}
            padAngle={1}
            cornerRadius={2}
            activeOuterRadiusOffset={4}
            enableArcLinkLabels={false}
            arcLabelsSkipAngle={15}
          />
        )
      case 'chart-area':
        return (
          <AreaChart 
            {...commonProps}
            enableGridX={false}
            enableGridY={showGrid}
            areaOpacity={widget.areaChartConfig?.styling?.areaOpacity ?? 0.4}
            curve="cardinal"
            enableArea={true}
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