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

  // Get chart configuration with defaults
  const chartConfig = widget.chartConfig || {}
  
  // Prepare props for LineChart (using BaseChartProps)
  const chartProps = {
    data,
    // Line chart specific configurations would be applied here
    // Note: LineChart component uses BaseChartProps, so we pass basic props
    xColumn: 'x',
    yColumn: 'y',
    isFullscreen: false
  }

  return (
    <div className="h-full w-full">
      <LineChart {...chartProps} />
    </div>
  )
}