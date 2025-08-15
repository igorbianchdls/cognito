'use client'

import { useState, useEffect } from 'react'
import { PieChart } from '@/components/charts'
import type { ChartData } from '@/components/charts/types'

export default function PieChartWidget() {
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

  return (
    <div className="h-full w-full">
      <PieChart 
        data={data}
      />
    </div>
  )
}