'use client'

import { useState, useEffect } from 'react'
import { LineChart } from '@/components/charts'
import type { ChartData } from '@/components/charts/types'
import type { DroppedWidget } from '@/types/widget'

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
  const chartConfig = widget.config?.chartConfig || widget.chartConfig || {}
  
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
    curve: chartConfig.curve || 'cardinal',
    enableArea: chartConfig.enableArea ?? false,
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
      <LineChart {...chartProps} />
    </div>
  )
}