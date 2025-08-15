'use client'

import { useState, useEffect } from 'react'
import { BarChart } from '@/components/charts'
import type { ChartData } from '@/components/charts/types'
import type { DroppedWidget } from '@/types/widget'

interface ChartWidgetProps {
  widget: DroppedWidget
}

export default function ChartWidget({ widget }: ChartWidgetProps) {
  const [data, setData] = useState<ChartData[]>([
    { x: 'Jan', y: 65 },
    { x: 'Feb', y: 78 },
    { x: 'Mar', y: 52 },
    { x: 'Apr', y: 82 },
    { x: 'May', y: 91 },
    { x: 'Jun', y: 73 },
  ])

  // Simulate real-time data updates
  useEffect(() => {
    const interval = setInterval(() => {
      setData(prevData => 
        prevData.map(item => ({
          ...item,
          y: Math.floor(Math.random() * 100) + 20
        }))
      )
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  // Get chart configuration with backward compatibility
  const chartConfig = widget.config?.chartConfig || widget.chartConfig || {}
  
  // Prepare props for BarChart
  const chartProps = {
    data,
    colors: chartConfig.colors || ['#2563eb'],
    enableGridX: chartConfig.enableGridX ?? false,
    enableGridY: chartConfig.enableGridY ?? true,
    borderRadius: chartConfig.borderRadius ?? 4,
    borderWidth: chartConfig.borderWidth ?? 0,
    padding: chartConfig.padding ?? 0.2,
    groupMode: chartConfig.groupMode || 'grouped',
    layout: chartConfig.layout || 'vertical',
    enableLabel: chartConfig.enableLabel ?? false,
    animate: chartConfig.animate ?? true,
    motionConfig: chartConfig.motionConfig || 'gentle',
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
    backgroundColor: chartConfig.backgroundColor || '#fff',
    title: chartConfig.title,
    subtitle: chartConfig.subtitle,
    titleFontSize: chartConfig.titleFontSize ?? 18,
    titleColor: chartConfig.titleColor || '#222',
  }

  return (
    <div className="h-full w-full">
      <BarChart {...chartProps} />
    </div>
  )
}