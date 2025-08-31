'use client'

import { useState, useEffect } from 'react'

export default function MetricWidget() {
  const [metric, setMetric] = useState({
    value: 1247,
    change: 12.5,
    label: 'Total Users',
    isIncreasing: true
  })

  // Simulate real-time metric updates
  useEffect(() => {
    const interval = setInterval(() => {
      const newValue = Math.floor(Math.random() * 2000) + 500
      const newChange = (Math.random() - 0.5) * 40
      
      setMetric(prev => ({
        ...prev,
        value: newValue,
        change: Number(newChange.toFixed(1)),
        isIncreasing: newChange > 0
      }))
    }, 4000)

    return () => clearInterval(interval)
  }, [])

  const formatValue = (value: number) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`
    }
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K`
    }
    return value.toString()
  }

  return (
    <div className="h-full flex flex-col justify-center items-center text-center p-2">
      {/* Main metric value */}
      <div className="text-2xl font-bold text-gray-900 mb-1">
        {formatValue(metric.value)}
      </div>
      
      {/* Metric label */}
      <div className="text-sm text-gray-600 mb-2">
        {metric.label}
      </div>
      
      {/* Change indicator */}
      <div className={`flex items-center gap-1 text-xs font-medium ${
        metric.isIncreasing ? 'text-green-600' : 'text-red-600'
      }`}>
        <span className="text-base">
          {metric.isIncreasing ? '↗' : '↘'}
        </span>
        <span>
          {Math.abs(metric.change)}%
        </span>
      </div>
      
      {/* Trend indicator */}
      <div className="w-full h-1 bg-gray-200 rounded-full mt-2 overflow-hidden">
        <div 
          className={`h-full transition-all duration-1000 ${
            metric.isIncreasing ? 'bg-green-500' : 'bg-red-500'
          }`}
          style={{
            width: `${Math.min(Math.abs(metric.change) * 2, 100)}%`,
            marginLeft: metric.isIncreasing ? '0' : 'auto'
          }}
        />
      </div>
    </div>
  )
}