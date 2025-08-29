'use client'

import { useState, useEffect } from 'react'
import { RefreshCw, AlertCircle, TrendingUp } from 'lucide-react'
import type { BigQueryField } from './TablesExplorer'

interface ChartData {
  x: string
  y: number
  label: string
  value: number
}

interface ChartPreviewProps {
  xAxis: BigQueryField[]
  yAxis: BigQueryField[]
  filters: BigQueryField[]
  chartType: 'bar' | 'line' | 'pie' | 'area'
  selectedTable: string | null
  onDataReady?: (data: ChartData[], query: string) => void
}

export default function ChartPreview({
  xAxis,
  yAxis,
  filters,
  chartType,
  selectedTable,
  onDataReady
}: ChartPreviewProps) {
  const [chartData, setChartData] = useState<ChartData[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState<string>('')

  // Generate SQL query based on current configuration
  const generateQuery = () => {
    if (!selectedTable || xAxis.length === 0 || yAxis.length === 0) {
      return ''
    }

    const xAxisColumn = xAxis[0]
    const yAxisColumn = yAxis[0]
    
    // Build SELECT clause
    const selectCols = [xAxisColumn.name]
    const aggregation = getAggregationFunction(yAxisColumn.type)
    selectCols.push(`${aggregation}(${yAxisColumn.name}) as ${yAxisColumn.name}_agg`)

    // Build WHERE clause for filters
    let whereClause = ''
    if (filters.length > 0) {
      const filterConditions = filters.map(filter => {
        // Simple filter example - in real implementation, this would be more sophisticated
        return `${filter.name} IS NOT NULL`
      }).join(' AND ')
      
      if (filterConditions) {
        whereClause = `WHERE ${filterConditions}`
      }
    }

    const sql = `
SELECT ${selectCols.join(', ')}
FROM \`creatto-463117.biquery_data.${selectedTable}\`
${whereClause}
GROUP BY ${xAxisColumn.name}
ORDER BY ${yAxisColumn.name}_agg DESC
LIMIT 50
    `.trim()

    return sql
  }

  // Get appropriate aggregation function based on data type
  const getAggregationFunction = (dataType: string) => {
    const lowerType = dataType.toLowerCase()
    
    if (lowerType.includes('string') || lowerType.includes('text')) {
      return 'COUNT'
    }
    
    if (lowerType.includes('int') || lowerType.includes('numeric') || lowerType.includes('float')) {
      return 'SUM'
    }
    
    return 'COUNT'
  }

  // Execute query and load data
  const loadChartData = async () => {
    if (!selectedTable || xAxis.length === 0 || yAxis.length === 0) {
      setChartData([])
      setError(null)
      return
    }

    const sql = generateQuery()
    setQuery(sql)
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/bigquery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'execute',
          query: sql
        })
      })

      const result = await response.json()

      if (result.success && result.data?.data && Array.isArray(result.data.data)) {
        const rawData = result.data.data
        const xAxisColumn = xAxis[0]
        const yAxisColumn = yAxis[0]
        
        // Transform data for chart
        const transformedData: ChartData[] = rawData.map((row: Record<string, unknown>) => ({
          x: String(row[xAxisColumn.name] || 'Unknown'),
          y: Number(row[`${yAxisColumn.name}_agg`] || 0),
          label: String(row[xAxisColumn.name] || 'Unknown'),
          value: Number(row[`${yAxisColumn.name}_agg`] || 0)
        }))

        setChartData(transformedData)
        
        // Notify parent component
        if (onDataReady) {
          onDataReady(transformedData, sql)
        }
      } else {
        throw new Error(result.error || 'No data returned from query')
      }
    } catch (err) {
      console.error('Error loading chart data:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
      setChartData([])
    } finally {
      setLoading(false)
    }
  }

  // Auto-reload when configuration changes
  useEffect(() => {
    const timer = setTimeout(() => {
      loadChartData()
    }, 500) // Debounce to avoid too many requests

    return () => clearTimeout(timer)
  }, [xAxis, yAxis, filters, selectedTable])

  // Simple chart rendering functions
  const renderBarChart = () => {
    if (chartData.length === 0) return null

    const maxValue = Math.max(...chartData.map(d => d.y))

    return (
      <div className="space-y-2">
        {chartData.slice(0, 8).map((item, index) => (
          <div key={index} className="flex items-center space-x-2">
            <div className="w-16 text-xs text-gray-700 truncate" title={item.label}>
              {item.label}
            </div>
            <div className="flex-1 bg-gray-200 rounded h-4 relative overflow-hidden">
              <div
                className="bg-blue-500 h-full rounded transition-all duration-500"
                style={{ width: `${Math.max(5, (item.y / maxValue) * 100)}%` }}
              />
            </div>
            <div className="text-xs text-gray-600 w-12 text-right">
              {item.y.toLocaleString()}
            </div>
          </div>
        ))}
      </div>
    )
  }

  const renderLineChart = () => {
    if (chartData.length === 0) return null

    return (
      <div className="h-32 flex items-end justify-between space-x-1 bg-gray-50 p-2 rounded">
        {chartData.slice(0, 10).map((item, index) => {
          const maxValue = Math.max(...chartData.map(d => d.y))
          const height = Math.max(4, (item.y / maxValue) * 100)
          
          return (
            <div key={index} className="flex flex-col items-center space-y-1">
              <div
                className="w-2 bg-blue-500 rounded-t transition-all duration-500"
                style={{ height: `${height}%` }}
                title={`${item.label}: ${item.y}`}
              />
              <div className="text-xs text-gray-600 w-8 truncate text-center" title={item.label}>
                {item.label.substring(0, 3)}
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  const renderPieChart = () => {
    if (chartData.length === 0) return null

    const total = chartData.reduce((sum, item) => sum + item.y, 0)

    return (
      <div className="space-y-2">
        {chartData.slice(0, 6).map((item, index) => {
          const percentage = ((item.y / total) * 100).toFixed(1)
          const color = `hsl(${(index * 360) / chartData.length}, 60%, 50%)`
          
          return (
            <div key={index} className="flex items-center space-x-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: color }}
              />
              <div className="flex-1 text-xs text-gray-700 truncate" title={item.label}>
                {item.label}
              </div>
              <div className="text-xs text-gray-600">
                {percentage}%
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  const renderChart = () => {
    switch (chartType) {
      case 'bar':
        return renderBarChart()
      case 'line':
        return renderLineChart()
      case 'pie':
        return renderPieChart()
      case 'area':
        return renderLineChart() // Similar to line for preview
      default:
        return renderBarChart()
    }
  }

  // Check if ready to render
  const canRender = selectedTable && xAxis.length > 0 && yAxis.length > 0

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center gap-2">
        <TrendingUp className="w-4 h-4 text-blue-600" />
        <h3 className="text-sm font-medium text-gray-900">Chart Preview</h3>
        {loading && <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />}
      </div>

      {/* Content */}
      <div className="border border-gray-200 rounded-lg p-3 bg-white min-h-[200px]">
        {!canRender ? (
          <div className="flex flex-col items-center justify-center h-48 text-gray-500">
            <TrendingUp className="w-8 h-8 mb-2 opacity-50" />
            <p className="text-sm text-center">
              Configure eixo X e Y para ver preview
            </p>
            <p className="text-xs text-center text-gray-400 mt-1">
              Arraste colunas do painel esquerdo
            </p>
          </div>
        ) : loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="text-center">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
              <p className="text-sm text-gray-600">Loading data...</p>
            </div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-48">
            <div className="text-center">
              <AlertCircle className="w-6 h-6 mx-auto mb-2 text-red-500" />
              <p className="text-sm text-red-600 mb-2">Error loading data</p>
              <p className="text-xs text-gray-500">{error}</p>
            </div>
          </div>
        ) : chartData.length === 0 ? (
          <div className="flex items-center justify-center h-48">
            <div className="text-center">
              <TrendingUp className="w-6 h-6 mx-auto mb-2 text-gray-400" />
              <p className="text-sm text-gray-600">No data found</p>
              <p className="text-xs text-gray-500">Try different columns or filters</p>
            </div>
          </div>
        ) : (
          <div>
            {renderChart()}
            
            {/* Data info */}
            <div className="mt-3 pt-3 border-t border-gray-100">
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>{chartData.length} records</span>
                <span>Table: {selectedTable}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Query Preview */}
      {query && (
        <details className="text-xs">
          <summary className="cursor-pointer text-gray-600 hover:text-gray-900">
            View SQL Query
          </summary>
          <pre className="mt-2 p-2 bg-gray-100 rounded text-xs font-mono overflow-x-auto">
            {query}
          </pre>
        </details>
      )}
    </div>
  )
}