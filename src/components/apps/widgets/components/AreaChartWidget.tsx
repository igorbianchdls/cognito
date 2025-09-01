'use client'

import { useState, useEffect, useMemo } from 'react'
import { AreaChart } from '@/components/charts'
import type { ChartData } from '@/components/charts/types'
import type { DroppedWidget } from '@/types/apps/widget'
import type { AreaChartConfig } from '@/types/apps/chartWidgets'

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

interface AreaChartWidgetProps {
  widget: DroppedWidget
}

export default function AreaChartWidget({ widget }: AreaChartWidgetProps) {
  const [data, setData] = useState<ChartData[]>([])

  // Initialize data based on widget config
  useEffect(() => {
    // Check if widget has BigQuery data
    if (widget.bigqueryData && widget.bigqueryData.data && Array.isArray(widget.bigqueryData.data)) {
      // Use BigQuery data from Chart Builder
      const bigqueryData = widget.bigqueryData.data as { x: string; y: number; label: string; value: number }[]
      const chartData = bigqueryData.map(item => ({
        x: item.x,
        y: item.y,
        label: item.label,
        value: item.value
      }))
      setData(chartData)
      console.log('📊 AreaChartWidget usando dados do BigQuery:', chartData)
    } else {
      // Use default sample data
      const defaultData = [
        { x: 'Q1', y: 120 },
        { x: 'Q2', y: 135 },
        { x: 'Q3', y: 148 },
        { x: 'Q4', y: 162 },
        { x: 'Q5', y: 175 },
        { x: 'Q6', y: 168 },
        { x: 'Q7', y: 185 },
        { x: 'Q8', y: 192 },
      ]
      setData(defaultData)
      console.log('📊 AreaChartWidget usando dados default')
      
      // Simulate real-time data updates for sample data only
      const interval = setInterval(() => {
        setData(prevData => 
          prevData.map(item => ({
            ...item,
            y: Math.floor(Math.random() * 100) + 100 // Range: 100-200
          }))
        )
      }, 7000)

      return () => clearInterval(interval)
    }
  }, [widget.config, widget.bigqueryData])

  // Get chart configuration with backward compatibility
  const chartConfig = useMemo(() => {
    let config: Partial<AreaChartConfig> = {}
    
    // Priorizar configuração especializada (nova arquitetura)
    if (widget.config && typeof widget.config === 'object' && widget.config.chartConfig) {
      config = widget.config.chartConfig as AreaChartConfig
      console.log('🎯 AreaChartWidget usando config.chartConfig:', config)
    }
    // Fallback para legacy chartConfig
    else if (widget.chartConfig) {
      config = widget.chartConfig as AreaChartConfig
      console.log('🎯 AreaChartWidget usando chartConfig legacy:', config)
    }
    
    console.log('📊 AreaChartWidget final config:', config)
    return config
  }, [widget.config, widget.chartConfig])
  
  // Prepare props for AreaChart
  const chartProps = {
    data,
    colors: chartConfig.colors || ['#2563eb'],
    enableGridX: chartConfig.enableGridX ?? false,
    enableGridY: chartConfig.enableGridY ?? true,
    // Area-specific settings
    enableArea: chartConfig.enableArea ?? true,
    areaOpacity: chartConfig.areaOpacity ?? 0.15,
    lineWidth: chartConfig.lineWidth ?? 2,
    pointSize: chartConfig.pointSize ?? 4,
    enablePoints: chartConfig.enablePoints ?? false,
    curve: chartConfig.curve || 'cardinal',
    animate: chartConfig.animate ?? false,
    motionConfig: chartConfig.motionConfig || 'gentle',
    legends: chartConfig.legends,
    margin: {
      top: chartConfig.margin?.top ?? 12,
      right: chartConfig.margin?.right ?? 12,
      bottom: chartConfig.margin?.bottom ?? 80,
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
        <AreaChart {...{
          ...chartProps,
          margin: {
            top: (chartProps.margin?.top ?? 12) + (typeof chartConfig.chartPadding === 'object' ? chartConfig.chartPadding?.top ?? 0 : chartConfig.chartPadding ?? 0),
            right: (chartProps.margin?.right ?? 8) + (typeof chartConfig.chartPadding === 'object' ? chartConfig.chartPadding?.right ?? 0 : chartConfig.chartPadding ?? 0),
            bottom: (chartProps.margin?.bottom ?? 80) + (typeof chartConfig.chartPadding === 'object' ? chartConfig.chartPadding?.bottom ?? 0 : chartConfig.chartPadding ?? 0),
            left: (chartProps.margin?.left ?? 8) + (typeof chartConfig.chartPadding === 'object' ? chartConfig.chartPadding?.left ?? 0 : chartConfig.chartPadding ?? 0),
          }
        }} />
      </div>
    </div>
  )
}