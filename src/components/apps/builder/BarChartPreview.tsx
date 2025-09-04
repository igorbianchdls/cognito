'use client'

import { useState, useEffect } from 'react'
import { RefreshCw, AlertCircle, BarChart3, Code2 } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { BarChart } from '@/components/charts'
import type { BigQueryField } from './TablesExplorer'

export interface BarChartData {
  [key: string]: string | number | boolean | null | undefined
}

interface BarChartPreviewProps {
  xAxis: BigQueryField[]
  yAxis: BigQueryField[]
  filters: BigQueryField[]
  selectedTable: string | null
  onDataReady?: (data: BarChartData[], query: string) => void
}

export default function BarChartPreview({
  xAxis,
  yAxis,
  filters,
  selectedTable,
  onDataReady
}: BarChartPreviewProps) {
  const [barChartData, setBarChartData] = useState<BarChartData[]>([])
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

  // Generate SQL query for bar chart
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

    console.log('📊 BarChartPreview executing query:', sqlQuery)

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
      const data = result.rows || []
      
      setBarChartData(data)
      
      // Call onDataReady callback
      if (onDataReady) {
        onDataReady(data, sqlQuery)
      }
      
      console.log('📊 BarChartPreview: Query executed successfully', data.length, 'rows')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      console.error('📊 BarChartPreview: Query failed:', errorMessage)
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
      setBarChartData([])
      if (onDataReady) {
        onDataReady([], '')
      }
    }
  }, [xAxis, yAxis, filters, selectedTable])

  // Prepare chart data for preview
  const chartData = barChartData.map((item) => {
    const xField = xAxis[0]?.name || 'category'
    const yField = yAxis[0]?.name || 'value'
    
    return {
      x: String(item[xField] || ''),
      y: Number(item[yField] || 0),
      label: String(item[xField] || ''),
      value: Number(item[yField] || 0)
    }
  })

  if (!selectedTable || xAxis.length === 0 || yAxis.length === 0) {
    return null
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-sm flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Bar Chart Preview
              {loading && <RefreshCw className="w-4 h-4 animate-spin" />}
            </CardTitle>
            <CardDescription className="text-xs">
              {barChartData.length} rows • {xAxis[0]?.name} × {yAxis[0]?.name}
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
            <BarChart 
              data={chartData}
              colors={['#2563eb']}
              enableGridX={false}
              enableGridY={true}
              margin={{ top: 20, right: 20, bottom: 40, left: 60 }}
              animate={false}
            />
          </div>
        )}
      </CardContent>
    </Card>
  )
}