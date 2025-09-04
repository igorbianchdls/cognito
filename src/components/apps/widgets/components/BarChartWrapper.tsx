'use client'

import { useState, useEffect } from 'react'
import { BarChart } from '@/components/charts'
import type { ChartData } from '@/components/charts/types'
import type { DroppedWidget } from '@/types/apps/widget'

interface BarChartWrapperProps {
  widget: DroppedWidget
}

export default function BarChartWrapper({ widget }: BarChartWrapperProps) {
  const [data, setData] = useState<ChartData[]>([])

  useEffect(() => {
    // Read data from barChartConfig
    const barChartConfig = widget.config?.barChartConfig
    
    if (barChartConfig?.bigqueryData?.data && Array.isArray(barChartConfig.bigqueryData.data)) {
      // Use real BigQuery data from barChartStore
      const bigqueryData = barChartConfig.bigqueryData.data
      const xAxisField = barChartConfig.bigqueryData.columns.xAxis[0]?.name
      const yAxisField = barChartConfig.bigqueryData.columns.yAxis[0]?.name
      
      if (xAxisField && yAxisField) {
        const chartData = bigqueryData.map((item: Record<string, unknown>) => ({
          x: String(item[xAxisField] || ''),
          y: Number(item[yAxisField] || 0),
          label: String(item[xAxisField] || ''),
          value: Number(item[yAxisField] || 0)
        }))
        
        setData(chartData)
        console.log('📊 BarChartWrapper usando dados reais do barChartStore:', chartData)
      }
    } else {
      // Fallback to empty data
      setData([])
      console.log('📊 BarChartWrapper: Nenhum dado disponível')
    }
  }, [widget.config])

  const barChartConfig = widget.config?.barChartConfig
  const styling = barChartConfig?.styling || {}

  return (
    <div className="h-full w-full">
      <BarChart 
        data={data}
        colors={styling.colors || ['#2563eb']}
        enableGridX={false}
        enableGridY={styling.showGrid ?? true}
        title={styling.title}
        margin={{ top: 12, right: 12, bottom: 60, left: 50 }}
        animate={false}
      />
    </div>
  )
}