'use client'

import { useState, useEffect } from 'react'
import { LineChart } from '@/components/charts'
import type { ChartData } from '@/components/charts/types'

export default function LineChartWidget() {
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

  return (
    <div className="h-full w-full">
      <LineChart 
        data={data}
      />
    </div>
  )
}