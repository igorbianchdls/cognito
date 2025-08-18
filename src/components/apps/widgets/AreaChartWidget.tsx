'use client'

import { useState, useEffect, useMemo } from 'react'
import { AreaChart } from '@/components/charts'
import type { ChartData } from '@/components/charts/types'
import type { DroppedWidget } from '@/types/widget'
import type { AreaChartConfig } from '@/types/chartWidgets'

interface AreaChartWidgetProps {
  widget: DroppedWidget
}

export default function AreaChartWidget({ widget }: AreaChartWidgetProps) {
  const [data, setData] = useState<ChartData[]>([
    { x: 'Q1', y: 120 },
    { x: 'Q2', y: 135 },
    { x: 'Q3', y: 148 },
    { x: 'Q4', y: 162 },
    { x: 'Q5', y: 175 },
    { x: 'Q6', y: 168 },
    { x: 'Q7', y: 185 },
    { x: 'Q8', y: 192 },
  ])

  // Simulate real-time data updates
  useEffect(() => {
    const interval = setInterval(() => {
      setData(prevData => 
        prevData.map(item => ({
          ...item,
          y: Math.floor(Math.random() * 100) + 100 // Range: 100-200
        }))
      )
    }, 7000)

    return () => clearInterval(interval)
  }, [])

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
    xColumn: 'x',
    yColumn: 'y',
    isFullscreen: false,
    colors: chartConfig.colors || ['#2563eb'],
    enableGridX: chartConfig.enableGridX ?? false,
    enableGridY: chartConfig.enableGridY ?? true,
    enableArea: chartConfig.enableArea ?? true,
    areaOpacity: chartConfig.areaOpacity ?? 0.15,
    lineWidth: chartConfig.lineWidth ?? 2,
    pointSize: chartConfig.pointSize ?? 4,
    animate: chartConfig.animate ?? true,
    motionConfig: chartConfig.motionConfig || 'gentle',
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
    } : undefined,
    axisLeft: chartConfig.axisLeft ? {
      tickSize: chartConfig.axisLeft.tickSize ?? 0,
      tickPadding: chartConfig.axisLeft.tickPadding ?? 8,
      tickRotation: chartConfig.axisLeft.tickRotation ?? 0,
      legend: chartConfig.axisLeft.legend,
    } : undefined,
  }

  return (
    <div className="h-full w-full">
      <AreaChart {...chartProps} />
    </div>
  )
}