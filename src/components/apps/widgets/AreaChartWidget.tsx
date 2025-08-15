'use client'

import { useState, useEffect } from 'react'
import { AreaChart } from '@/components/charts'
import type { ChartData } from '@/components/charts/types'
import type { DroppedWidget } from '@/types/widget'

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

  // Get chart configuration with defaults
  const chartConfig = widget.chartConfig || {}
  
  // Prepare props for AreaChart (using BaseChartProps)
  const chartProps = {
    data,
    xColumn: 'x',
    yColumn: 'y',
    isFullscreen: false
  }

  return (
    <div className="h-full w-full">
      <AreaChart {...chartProps} />
    </div>
  )
}