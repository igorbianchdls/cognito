'use client'

import { useState, useEffect, useMemo } from 'react'
import { BarChart } from '@/components/charts'
import type { ChartData } from '@/components/charts/types'
import type { DroppedWidget } from '@/types/widget'
import type { BarChartConfig } from '@/types/chartWidgets'

// Helper function to convert hex color + opacity to RGBA
function hexToRgba(hex: string, opacity: number = 1): string {
  // Remove # if present
  hex = hex.replace('#', '')
  
  // Convert 3-digit hex to 6-digit
  if (hex.length === 3) {
    hex = hex.split('').map(char => char + char).join('')
  }
  
  // Parse RGB values
  const r = parseInt(hex.substring(0, 2), 16)
  const g = parseInt(hex.substring(2, 4), 16)
  const b = parseInt(hex.substring(4, 6), 16)
  
  return `rgba(${r}, ${g}, ${b}, ${opacity})`
}

interface ChartWidgetProps {
  widget: DroppedWidget
}

export default function ChartWidget({ widget }: ChartWidgetProps) {
  const [data, setData] = useState<ChartData[]>([])

  // Initialize data based on widget config
  useEffect(() => {
    // Check if widget has BigQuery data
    if (widget.config && typeof widget.config === 'object' && 'data' in widget.config && Array.isArray(widget.config.data)) {
      // Use BigQuery data from Chart Builder
      const bigqueryData = widget.config.data as { x: string; y: number; label: string; value: number }[]
      const chartData = bigqueryData.map(item => ({
        x: item.x,
        y: item.y,
        label: item.label,
        value: item.value
      }))
      setData(chartData)
      console.log('📊 ChartWidget usando dados do BigQuery:', chartData)
    } else {
      // Use default sample data
      const defaultData = [
        { x: 'Jan', y: 65 },
        { x: 'Feb', y: 78 },
        { x: 'Mar', y: 52 },
        { x: 'Apr', y: 82 },
        { x: 'May', y: 91 },
        { x: 'Jun', y: 73 },
      ]
      setData(defaultData)
      console.log('📊 ChartWidget usando dados default')
      
      // Simulate real-time data updates for sample data only
      const interval = setInterval(() => {
        setData(prevData => 
          prevData.map(item => ({
            ...item,
            y: Math.floor(Math.random() * 100) + 20
          }))
        )
      }, 5000)

      return () => clearInterval(interval)
    }
  }, [widget.config])

  // Get chart configuration with backward compatibility
  const chartConfig = useMemo(() => {
    console.log('📊 ChartWidget recebendo widget update:', {
      id: widget.i,
      type: widget.type,
      hasConfig: !!widget.config,
      hasChartConfig: !!widget.chartConfig,
      configStructure: widget.config,
      chartConfigDirect: widget.chartConfig,
      configChartConfig: widget.config?.chartConfig
    })
    
    let config: Partial<BarChartConfig> = {}
    
    // Priorizar configuração especializada (nova arquitetura)
    if (widget.config && typeof widget.config === 'object' && widget.config.chartConfig) {
      config = widget.config.chartConfig as BarChartConfig
      console.log('📊 ChartWidget usando config.chartConfig:', config)
    }
    // Fallback para legacy chartConfig
    else if (widget.chartConfig) {
      config = widget.chartConfig as BarChartConfig
      console.log('📊 ChartWidget usando chartConfig legacy:', config)
    } else {
      console.log('📊 ChartWidget: Nenhuma config encontrada, usando vazia')
    }
    
    console.log('📊 ChartWidget final config com propriedades:', {
      config,
      keys: Object.keys(config),
      groupMode: config.groupMode,
      colors: config.colors,
      enableGridX: config.enableGridX,
      enableGridY: config.enableGridY
    })
    return config
  }, [widget.config, widget.chartConfig])
  
  // Prepare props for BarChart
  const chartProps = {
    data,
    colors: chartConfig.colors || ['#2563eb'],
    enableGridX: chartConfig.enableGridX ?? false,
    enableGridY: chartConfig.enableGridY ?? true,
    borderRadius: chartConfig.borderRadius ?? 4,
    borderWidth: chartConfig.borderWidth ?? 0,
    borderColor: chartConfig.borderColor ? hexToRgba(chartConfig.borderColor, (chartConfig as Record<string, unknown>).borderOpacity as number ?? 1) : undefined,
    padding: chartConfig.padding ?? 0.2,
    groupMode: chartConfig.groupMode || 'grouped',
    layout: chartConfig.layout || 'vertical',
    enableLabel: chartConfig.enableLabel ?? false,
    labelPosition: chartConfig.labelPosition || 'middle',
    labelSkipWidth: chartConfig.labelSkipWidth ?? 0,
    labelSkipHeight: chartConfig.labelSkipHeight ?? 0,
    labelTextColor: chartConfig.labelTextColor || '#374151',
    animate: chartConfig.animate ?? false,
    motionConfig: chartConfig.motionConfig || 'gentle',
    legends: chartConfig.legends,
    margin: {
      top: chartConfig.margin?.top ?? 12,
      right: chartConfig.margin?.right ?? 12,
      bottom: chartConfig.margin?.bottom ?? 60,
      left: chartConfig.margin?.left ?? 50,
    },
    axisBottom: chartConfig.axisBottom ? {
      tickSize: chartConfig.axisBottom.tickSize ?? 0,
      tickPadding: chartConfig.axisBottom.tickPadding ?? 8,
      tickRotation: chartConfig.axisBottom.tickRotation ?? 0,
      legend: chartConfig.axisBottom.legend,
    } : {
      tickSize: 0,
      tickPadding: 8,
      tickRotation: 0,
    },
    axisLeft: chartConfig.axisLeft ? {
      tickSize: chartConfig.axisLeft.tickSize ?? 0,
      tickPadding: chartConfig.axisLeft.tickPadding ?? 8,
      tickRotation: chartConfig.axisLeft.tickRotation ?? 0,
      legend: chartConfig.axisLeft.legend,
    } : {
      tickSize: 0,
      tickPadding: 8,
      tickRotation: 0,
    },
    backgroundColor: hexToRgba(chartConfig.backgroundColor || '#fff', (chartConfig as Record<string, unknown>).backgroundOpacity as number ?? 1),
  }

  return (
    <div className="h-full w-full flex flex-col">
      {/* Title and Subtitle */}
      {(chartConfig.showTitle !== false && chartConfig.title) && (
        <div style={{ 
          paddingTop: `${typeof chartConfig.titlePadding === 'object' ? chartConfig.titlePadding?.top ?? 8 : chartConfig.titlePadding ?? 8}px`,
          paddingRight: `${typeof chartConfig.titlePadding === 'object' ? chartConfig.titlePadding?.right ?? 8 : chartConfig.titlePadding ?? 8}px`,
          paddingBottom: `${typeof chartConfig.titlePadding === 'object' ? chartConfig.titlePadding?.bottom ?? 8 : chartConfig.titlePadding ?? 8}px`,
          paddingLeft: `${typeof chartConfig.titlePadding === 'object' ? chartConfig.titlePadding?.left ?? 8 : chartConfig.titlePadding ?? 8}px`
        }}>
          <h3 
            style={{
              fontSize: `${chartConfig.titleFontSize ?? 18}px`,
              color: chartConfig.titleColor ?? '#111827',
              fontWeight: chartConfig.titleFontWeight ?? 700,
              lineHeight: 1.2,
              margin: 0,
              textAlign: 'left'
            }}
          >
            {chartConfig.title}
          </h3>
        </div>
      )}
      {(chartConfig.showSubtitle !== false && chartConfig.subtitle) && (
        <div style={{ 
          paddingTop: `${typeof chartConfig.subtitlePadding === 'object' ? chartConfig.subtitlePadding?.top ?? 8 : chartConfig.subtitlePadding ?? 8}px`,
          paddingRight: `${typeof chartConfig.subtitlePadding === 'object' ? chartConfig.subtitlePadding?.right ?? 8 : chartConfig.subtitlePadding ?? 8}px`,
          paddingBottom: `${typeof chartConfig.subtitlePadding === 'object' ? chartConfig.subtitlePadding?.bottom ?? 8 : chartConfig.subtitlePadding ?? 8}px`,
          paddingLeft: `${typeof chartConfig.subtitlePadding === 'object' ? chartConfig.subtitlePadding?.left ?? 8 : chartConfig.subtitlePadding ?? 8}px`
        }}>
          <p 
            style={{
              fontSize: `${chartConfig.subtitleFontSize ?? 14}px`,
              color: chartConfig.subtitleColor ?? '#6B7280',
              fontWeight: chartConfig.subtitleFontWeight ?? 400,
              lineHeight: 1.4,
              margin: 0,
              textAlign: 'left'
            }}
          >
            {chartConfig.subtitle}
          </p>
        </div>
      )}
      
      {/* Chart */}
      <div className="flex-1">
        <BarChart {...{
          ...chartProps,
          margin: {
            top: (chartProps.margin?.top ?? 12) + (typeof chartConfig.chartPadding === 'object' ? chartConfig.chartPadding?.top ?? 0 : chartConfig.chartPadding ?? 0),
            right: (chartProps.margin?.right ?? 12) + (typeof chartConfig.chartPadding === 'object' ? chartConfig.chartPadding?.right ?? 0 : chartConfig.chartPadding ?? 0),
            bottom: (chartProps.margin?.bottom ?? 60) + (typeof chartConfig.chartPadding === 'object' ? chartConfig.chartPadding?.bottom ?? 0 : chartConfig.chartPadding ?? 0),
            left: (chartProps.margin?.left ?? 50) + (typeof chartConfig.chartPadding === 'object' ? chartConfig.chartPadding?.left ?? 0 : chartConfig.chartPadding ?? 0),
          }
        }} />
      </div>
    </div>
  )
}