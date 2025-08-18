'use client'

import { useState, useEffect, useMemo } from 'react'
import { PieChart } from '@/components/charts'
import type { ChartData } from '@/components/charts/types'
import type { DroppedWidget } from '@/types/widget'
import type { PieChartConfig } from '@/types/chartWidgets'

interface PieChartWidgetProps {
  widget: DroppedWidget
}

export default function PieChartWidget({ widget }: PieChartWidgetProps) {
  const [data, setData] = useState<ChartData[]>([
    { x: 'Desktop', y: 42 },
    { x: 'Mobile', y: 35 },
    { x: 'Tablet', y: 18 },
    { x: 'Other', y: 5 },
  ])

  // Simulate real-time data updates
  useEffect(() => {
    const interval = setInterval(() => {
      setData(prevData => {
        const total = 100
        const newData = prevData.map((item, index) => {
          const variation = (Math.random() - 0.5) * 10 // ±5%
          const newValue = Math.max(5, Math.min(50, (item.y || 0) + variation))
          return { ...item, y: newValue }
        })
        
        // Normalize to 100%
        const sum = newData.reduce((acc, item) => acc + (item.y || 0), 0)
        return newData.map(item => ({
          ...item,
          y: Math.round(((item.y || 0) / sum) * total)
        }))
      })
    }, 6000)

    return () => clearInterval(interval)
  }, [])

  // Get chart configuration with backward compatibility
  const chartConfig = useMemo(() => {
    let config: Partial<PieChartConfig> = {}
    
    // Priorizar configuração especializada (nova arquitetura)
    if (widget.config && typeof widget.config === 'object' && widget.config.chartConfig) {
      config = widget.config.chartConfig as PieChartConfig
      console.log('🎯 PieChartWidget usando config.chartConfig:', config)
    }
    // Fallback para legacy chartConfig
    else if (widget.chartConfig) {
      config = widget.chartConfig as PieChartConfig
      console.log('🎯 PieChartWidget usando chartConfig legacy:', config)
    }
    
    console.log('📊 PieChartWidget final config:', config)
    return config
  }, [widget.config, widget.chartConfig])
  
  // Prepare props for PieChart
  const chartProps = {
    data,
    xColumn: 'x',
    yColumn: 'y',
    isFullscreen: false,
    colors: chartConfig.colors,
    innerRadius: chartConfig.innerRadius ?? 0.5,
    padAngle: chartConfig.padAngle ?? 1,
    cornerRadius: chartConfig.cornerRadius ?? 2,
    activeOuterRadiusOffset: chartConfig.activeOuterRadiusOffset ?? 4,
    borderWidth: chartConfig.borderWidth ?? 0,
    enableArcLinkLabels: chartConfig.enableArcLinkLabels ?? false,
    arcLabelsSkipAngle: chartConfig.arcLabelsSkipAngle ?? 15,
    animate: chartConfig.animate ?? false,
    motionConfig: chartConfig.motionConfig || 'gentle',
    legends: chartConfig.legends,
    margin: {
      top: chartConfig.margin?.top ?? 20,
      right: chartConfig.margin?.right ?? 20,
      bottom: chartConfig.margin?.bottom ?? 80,
      left: chartConfig.margin?.left ?? 20,
    },
  }

  return (
    <div className="h-full w-full">
      <PieChart {...chartProps} />
    </div>
  )
}