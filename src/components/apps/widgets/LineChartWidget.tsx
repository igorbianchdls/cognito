'use client'

import { useState, useEffect, useMemo } from 'react'
import { LineChart } from '@/components/charts'
import type { ChartData } from '@/components/charts/types'
import type { DroppedWidget } from '@/types/widget'
import type { LineChartConfig } from '@/types/chartWidgets'

interface LineChartWidgetProps {
  widget: DroppedWidget
}

export default function LineChartWidget({ widget }: LineChartWidgetProps) {
  const [data, setData] = useState<ChartData[]>([
    { x: 'Jan', y: 45 },
    { x: 'Feb', y: 52 },
    { x: 'Mar', y: 48 },
    { x: 'Apr', y: 61 },
    { x: 'May', y: 55 },
    { x: 'Jun', y: 67 },
    { x: 'Jul', y: 72 },
    { x: 'Aug', y: 68 },
  ])

  // Simulate real-time data updates
  useEffect(() => {
    const interval = setInterval(() => {
      setData(prevData => 
        prevData.map(item => ({
          ...item,
          y: Math.floor(Math.random() * 60) + 30
        }))
      )
    }, 4000)

    return () => clearInterval(interval)
  }, [])

  // Get chart configuration with backward compatibility
  const chartConfig = useMemo(() => {
    let config: Partial<LineChartConfig> = {}
    
    // Priorizar configuração especializada (nova arquitetura)
    if (widget.config && typeof widget.config === 'object' && widget.config.chartConfig) {
      config = widget.config.chartConfig as LineChartConfig
      console.log('🎯 LineChartWidget usando config.chartConfig:', config)
    }
    // Fallback para legacy chartConfig
    else if (widget.chartConfig) {
      config = widget.chartConfig as LineChartConfig
      console.log('🎯 LineChartWidget usando chartConfig legacy:', config)
    }
    
    console.log('📊 LineChartWidget final config:', config)
    console.log('🔍 DEBUG titlePadding:', config.titlePadding, 'titleFontWeight:', config.titleFontWeight)
    console.log('🔍 DEBUG subtitlePadding:', config.subtitlePadding, 'subtitleFontWeight:', config.subtitleFontWeight)
    console.log('🔍 DEBUG chartPadding:', config.chartPadding)
    return config
  }, [widget.config, widget.chartConfig])
  
  // Prepare props for LineChart
  const chartProps = {
    data,
    xColumn: 'x',
    yColumn: 'y',
    isFullscreen: false,
    colors: chartConfig.colors || ['#2563eb'],
    enableGridX: chartConfig.enableGridX ?? false,
    enableGridY: chartConfig.enableGridY ?? true,
    enablePoints: chartConfig.enablePoints ?? true,
    pointSize: chartConfig.pointSize ?? 4,
    lineWidth: chartConfig.lineWidth ?? 2,
    curve: chartConfig.curve || 'cardinal',
    enableArea: chartConfig.enableArea ?? false,
    areaOpacity: chartConfig.areaOpacity ?? 0.2,
    animate: chartConfig.animate ?? false,
    motionConfig: chartConfig.motionConfig || 'gentle',
    legends: chartConfig.legends,
    margin: {
      top: chartConfig.margin?.top ?? 12,
      right: chartConfig.margin?.right ?? 8,
      bottom: chartConfig.margin?.bottom ?? 80,
      left: chartConfig.margin?.left ?? 8,
    },
    axisBottom: chartConfig.axisBottom ? {
      tickSize: chartConfig.axisBottom.tickSize ?? 0,
      tickPadding: chartConfig.axisBottom.tickPadding ?? 8,
      tickRotation: chartConfig.axisBottom.tickRotation ?? 0,
      legend: chartConfig.axisBottom.legend,
    } : undefined,
    axisLeft: chartConfig.axisLeft ? {
      tickSize: chartConfig.axisLeft.tickSize ?? 0,
      tickPadding: chartConfig.axisLeft.tickPadding ?? 8,
      tickRotation: chartConfig.axisLeft.tickRotation ?? 0,
      legend: chartConfig.axisLeft.legend,
    } : undefined,
  }

  return (
    <div className="h-full w-full flex flex-col">
      {/* Title and Subtitle */}
      {(chartConfig.showTitle !== false && chartConfig.title) && (
        <div style={{ 
          padding: "20px",
          backgroundColor: "lightblue"
        }}>
          <h3 
            style={{
              fontSize: `${chartConfig.titleFontSize ?? 18}px`,
              color: chartConfig.titleColor ?? '#111827',
              fontWeight: 800,
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
          padding: "15px",
          backgroundColor: "lightgreen"
        }}>
          <p 
            style={{
              fontSize: `${chartConfig.subtitleFontSize ?? 14}px`,
              color: chartConfig.subtitleColor ?? '#6B7280',
              fontWeight: 600,
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
        <LineChart {...{
          ...chartProps,
          margin: {
            top: (chartProps.margin?.top ?? 12) + (chartConfig.chartPadding ?? 0),
            right: (chartProps.margin?.right ?? 8) + (chartConfig.chartPadding ?? 0),
            bottom: (chartProps.margin?.bottom ?? 80) + (chartConfig.chartPadding ?? 0),
            left: (chartProps.margin?.left ?? 8) + (chartConfig.chartPadding ?? 0),
          }
        }} />
      </div>
    </div>
  )
}