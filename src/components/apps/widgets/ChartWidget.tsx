'use client'

import { useState, useEffect } from 'react'

export default function ChartWidget() {
  const [data, setData] = useState([
    { name: 'Jan', value: 65 },
    { name: 'Feb', value: 78 },
    { name: 'Mar', value: 52 },
    { name: 'Apr', value: 82 },
    { name: 'May', value: 91 },
    { name: 'Jun', value: 73 },
  ])

  // Simulate real-time data updates
  useEffect(() => {
    const interval = setInterval(() => {
      setData(prevData => 
        prevData.map(item => ({
          ...item,
          value: Math.floor(Math.random() * 100) + 20
        }))
      )
    }, 3000)

    return () => clearInterval(interval)
  }, [])

  const maxValue = Math.max(...data.map(d => d.value))

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 flex items-end gap-2 px-2">
        {data.map((item, index) => (
          <div key={item.name} className="flex-1 flex flex-col items-center gap-1">
            <div 
              className="w-full bg-blue-500 hover:bg-blue-600 transition-all duration-500 rounded-sm min-h-[4px]"
              style={{
                height: `${(item.value / maxValue) * 100}%`,
              }}
              title={`${item.name}: ${item.value}`}
            />
            <span className="text-xs text-gray-500 font-medium">{item.name}</span>
          </div>
        ))}
      </div>
      
      {/* Chart summary */}
      <div className="mt-2 pt-2 border-t border-gray-100">
        <div className="flex justify-between items-center text-xs text-gray-600">
          <span>Avg: {Math.round(data.reduce((sum, item) => sum + item.value, 0) / data.length)}</span>
          <span>Max: {maxValue}</span>
        </div>
      </div>
    </div>
  )
}