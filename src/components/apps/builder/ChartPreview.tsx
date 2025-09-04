'use client'

import { useState, useEffect } from 'react'
import { RefreshCw, AlertCircle, BarChart3, TrendingUp, PieChart, Activity, Code2 } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { BarChart } from '@/components/charts'
import { LineChart } from '@/components/charts'
import { PieChart as PieChartComponent } from '@/components/charts'
import type { BigQueryField } from './TablesExplorer'

export interface ChartData {
  [key: string]: string | number | boolean | null | undefined
}

interface ChartPreviewProps {
  chartType: 'bar' | 'line' | 'pie' | 'area'
  xAxis: BigQueryField[]
  yAxis: BigQueryField[]
  filters: BigQueryField[]
  selectedTable: string | null
  onDataReady?: (data: ChartData[], query: string) => void
}

export default function ChartPreview({
  chartType,
  xAxis,
  yAxis,
  filters,
  selectedTable,
  onDataReady
}: ChartPreviewProps) {
  const [chartData, setChartData] = useState<ChartData[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState<string>('')
  const [showQuery, setShowQuery] = useState(false)

  // Get aggregation function for measure field
  const getAggregationFunction = (field: BigQueryField): string => {
    if (field.aggregation) return field.aggregation.toUpperCase()
    
    const lowerType = field.type.toLowerCase()
    if (lowerType.includes('string') || lowerType.includes('text')) {
      return 'COUNT'
    }
    return 'SUM' // Default for numeric fields
  }

  // Generate SQL query for chart
  const generateQuery = () => {
    if (!selectedTable || xAxis.length === 0 || yAxis.length === 0) {
      return ''
    }

    const xField = xAxis[0]
    const yField = yAxis[0]
    const aggregation = getAggregationFunction(yField)
    
    let query = `SELECT ${xField.name}, ${aggregation}(${yField.name}) as ${yField.name}`
    query += ` FROM \`creatto-463117.biquery_data.${selectedTable}\``
    
    // Add WHERE clause for filters
    if (filters.length > 0) {
      const filterConditions = filters.map(filter => `${filter.name} IS NOT NULL`).join(' AND ')
      query += ` WHERE ${filterConditions}`
    }
    
    query += ` GROUP BY ${xField.name}`
    query += ` ORDER BY ${yField.name} DESC`
    query += ` LIMIT 20`
    
    return query
  }

  // Execute BigQuery
  const executeQuery = async (sqlQuery: string) => {
    if (!sqlQuery) return

    setLoading(true)
    setError(null)

    console.log(`📊 ChartPreview (${chartType}) executing query:`, sqlQuery)

    try {
      const response = await fetch('/api/bigquery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'execute',
          query: sqlQuery 
        })
      })

      if (!response.ok) {
        const responseText = await response.text()
        throw new Error(`Query failed: ${response.statusText} - ${responseText}`)
      }

      const result = await response.json()
      
      console.log(`📊 ChartPreview (${chartType}): Resultado parseado`, {
        success: result.success,
        hasData: !!result.data,
        dataType: typeof result.data,
        hasDataArray: Array.isArray(result.data?.data),
        dataLength: result.data?.data?.length,
        error: result.error
      })
      
      if (result.success && result.data?.data && Array.isArray(result.data.data)) {
        const data = result.data.data as ChartData[]
        
        setChartData(data)
        
        // Call onDataReady callback
        if (onDataReady) {
          onDataReady(data, sqlQuery)
        }
        
        console.log(`📊 ChartPreview (${chartType}): Query executed successfully`, data.length, 'rows')
      } else {
        throw new Error(result.error || 'No data returned from query')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      console.error(`📊 ChartPreview (${chartType}): Query failed:`, errorMessage)
    } finally {
      setLoading(false)
    }
  }

  // Auto-execute when dependencies change
  useEffect(() => {
    const newQuery = generateQuery()
    setQuery(newQuery)
    
    if (newQuery) {
      executeQuery(newQuery)
    } else {
      setChartData([])
      if (onDataReady) {
        onDataReady([], '')
      }
    }
  }, [xAxis, yAxis, filters, selectedTable, chartType])

  // Prepare chart data for preview
  const preparedChartData = chartData.map((item) => {
    const xField = xAxis[0]?.name || 'category'
    const yField = yAxis[0]?.name || 'value'
    
    return {
      x: String(item[xField] || ''),
      y: Number(item[yField] || 0),
      label: String(item[xField] || ''),
      value: Number(item[yField] || 0)
    }
  })

  // Get chart icon based on type
  const getChartIcon = () => {
    switch (chartType) {
      case 'bar': return <BarChart3 className="w-4 h-4" />
      case 'line': return <TrendingUp className="w-4 h-4" />
      case 'pie': return <PieChart className="w-4 h-4" />
      case 'area': return <Activity className="w-4 h-4" />
      default: return <BarChart3 className="w-4 h-4" />
    }
  }

  // Get chart title based on type
  const getChartTitle = () => {
    switch (chartType) {
      case 'bar': return 'Bar Chart Preview'
      case 'line': return 'Line Chart Preview'
      case 'pie': return 'Pie Chart Preview'
      case 'area': return 'Area Chart Preview'
      default: return 'Chart Preview'
    }
  }

  // Render the appropriate chart component
  const renderChart = () => {
    const commonProps = {
      data: preparedChartData,
      colors: ['#2563eb'],
      margin: { top: 20, right: 20, bottom: 40, left: 60 },
      animate: false
    }

    switch (chartType) {
      case 'bar':
        return (
          <BarChart 
            {...commonProps}
            enableGridX={false}
            enableGridY={true}
          />
        )
      case 'line':
        return (
          <LineChart 
            {...commonProps}
            enableGridX={false}
            enableGridY={true}
          />
        )
      case 'pie':
        return (
          <PieChartComponent 
            {...commonProps}
          />
        )
      case 'area':
        // Assuming you have an AreaChart component
        return (
          <BarChart 
            {...commonProps}
            enableGridX={false}
            enableGridY={true}
          />
        )
      default:
        return (
          <BarChart 
            {...commonProps}
            enableGridX={false}
            enableGridY={true}
          />
        )
    }
  }

  if (!selectedTable || xAxis.length === 0 || yAxis.length === 0) {
    return null
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-sm flex items-center gap-2">
              {getChartIcon()}
              {getChartTitle()}
              {loading && <RefreshCw className="w-4 h-4 animate-spin" />}
            </CardTitle>
            <CardDescription className="text-xs">
              {chartData.length} rows • {xAxis[0]?.name} × {yAxis[0]?.name}
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowQuery(!showQuery)}
            className="gap-1"
          >
            <Code2 className="w-3 h-3" />
            SQL
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {showQuery && (
          <div className="mb-4 p-3 bg-gray-50 rounded-md">
            <h4 className="text-xs font-medium mb-2">SQL Query:</h4>
            <code className="text-xs text-gray-700 font-mono whitespace-pre-wrap">{query}</code>
          </div>
        )}
        
        {error ? (
          <div className="flex items-center gap-2 text-red-600 text-sm">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        ) : (
          <div className="h-48">
            {renderChart()}
          </div>
        )}
      </CardContent>
    </Card>
  )
}