'use client'

import { useState, useEffect } from 'react'
import { RefreshCw, AlertCircle, TrendingUp } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
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

  // Generate programmatic code for chart creation
  const generateChartCode = () => {
    if (!selectedTable || xAxis.length === 0 || yAxis.length === 0) {
      return ''
    }

    const yAxisField = yAxis[0]
    const aggregation = getAggregationFunction(yAxisField)
    const yFieldWithAggregation = `${aggregation}(${yAxisField.name})`

    return `createChart({
  project: "creatto-463117",
  dataset: "biquery_data",
  table: "${selectedTable}",
  x: "${xAxis[0].name}",
  y: "${yFieldWithAggregation}",
  type: "${chartType}"
})`
  }

  // Copy code to clipboard
  const copyCodeToClipboard = async () => {
    const code = generateChartCode()
    if (code) {
      try {
        await navigator.clipboard.writeText(code)
        // Could add a toast notification here
      } catch (err) {
        console.error('Failed to copy code:', err)
      }
    }
  }

  // Generate SQL query based on current configuration
  const generateQuery = () => {
    if (!selectedTable || xAxis.length === 0 || yAxis.length === 0) {
      return ''
    }

    const xAxisColumn = xAxis[0]
    const yAxisColumn = yAxis[0]
    
    // Build SELECT clause
    const selectCols = [xAxisColumn.name]
    const aggregation = getAggregationFunction(yAxisColumn)
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

  // Get appropriate aggregation function - use selected aggregation or default
  const getAggregationFunction = (field: BigQueryField) => {
    // If aggregation is explicitly set, use it
    if (field.aggregation) {
      return field.aggregation
    }
    
    // Otherwise, use default based on data type
    const lowerType = field.type.toLowerCase()
    
    if (lowerType.includes('string') || lowerType.includes('text')) {
      return 'COUNT'
    }
    
    if (lowerType.includes('int') || lowerType.includes('numeric') || lowerType.includes('float')) {
      return 'SUM'
    }
    
    return 'COUNT'
  }

  // Generate fallback data for preview when API fails
  const generateFallbackData = (): ChartData[] => {
    const xAxisColumn = xAxis[0]
    const yAxisColumn = yAxis[0]
    
    // Generate sample data based on chart type
    const sampleLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug']
    const baseValue = chartType === 'pie' ? 25 : 100
    
    return sampleLabels.map((label, index) => {
      const variation = Math.random() * 0.5 + 0.75 // 75%-125% variation
      const value = Math.round(baseValue * variation * (index + 1) / 4)
      
      return {
        x: label,
        y: value,
        label: label,
        value: value
      }
    }).slice(0, chartType === 'pie' ? 4 : 6) // Limit data points
  }

  // Execute query and load data
  const loadChartData = async () => {
    console.log('📊 ChartPreview: loadChartData iniciado', {
      selectedTable,
      xAxisLength: xAxis.length,
      yAxisLength: yAxis.length,
      xAxis: xAxis.map(x => ({ name: x.name, type: x.type })),
      yAxis: yAxis.map(y => ({ name: y.name, type: y.type, aggregation: y.aggregation }))
    })

    if (!selectedTable || xAxis.length === 0 || yAxis.length === 0) {
      console.log('📊 ChartPreview: Configuração incompleta, limpando dados')
      setChartData([])
      setError(null)
      return
    }

    const sql = generateQuery()
    console.log('📊 ChartPreview: SQL gerado:', sql)
    setQuery(sql)
    setLoading(true)
    setError(null)

    try {
      console.log('📊 ChartPreview: Fazendo chamada para /api/bigquery')
      
      // Add timeout to fetch request
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout
      
      const response = await fetch('/api/bigquery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'execute',
          query: sql
        }),
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)

      console.log('📊 ChartPreview: Resposta recebida', {
        status: response.status,
        ok: response.ok,
        statusText: response.statusText
      })

      if (!response.ok) {
        throw new Error(`API response: ${response.status} ${response.statusText}`)
      }

      const result = await response.json()
      console.log('📊 ChartPreview: Resultado parseado', {
        success: result.success,
        hasData: !!result.data,
        dataType: typeof result.data,
        hasDataArray: Array.isArray(result.data?.data),
        dataLength: result.data?.data?.length,
        error: result.error
      })

      if (result.success && result.data?.data && Array.isArray(result.data.data)) {
        const rawData = result.data.data
        const xAxisColumn = xAxis[0]
        const yAxisColumn = yAxis[0]
        
        console.log('📊 ChartPreview: Transformando dados', {
          rawDataLength: rawData.length,
          sampleRow: rawData[0],
          xColumn: xAxisColumn.name,
          yColumn: `${yAxisColumn.name}_agg`
        })
        
        // Transform data for chart
        const transformedData: ChartData[] = rawData.map((row: Record<string, unknown>) => ({
          x: String(row[xAxisColumn.name] || 'Unknown'),
          y: Number(row[`${yAxisColumn.name}_agg`] || 0),
          label: String(row[xAxisColumn.name] || 'Unknown'),
          value: Number(row[`${yAxisColumn.name}_agg`] || 0)
        }))

        console.log('📊 ChartPreview: Dados transformados', {
          transformedLength: transformedData.length,
          sampleTransformed: transformedData[0]
        })

        setChartData(transformedData)
        
        // Notify parent component
        if (onDataReady) {
          console.log('📊 ChartPreview: Notificando parent component')
          onDataReady(transformedData, sql)
        }
      } else {
        const errorMsg = result.error || 'No data returned from query'
        console.error('📊 ChartPreview: Erro no resultado', errorMsg)
        throw new Error(errorMsg)
      }
    } catch (err) {
      console.error('📊 ChartPreview: Erro na execução', err)
      
      // Check if it's an abort error (timeout)
      if (err instanceof Error && err.name === 'AbortError') {
        console.log('📊 ChartPreview: Timeout - usando dados simulados')
        setError('API timeout - usando dados simulados para preview')
      } else {
        console.log('📊 ChartPreview: Erro de API - usando dados simulados')
        setError('API indisponível - usando dados simulados para preview')
      }
      
      // Generate fallback data for preview
      const fallbackData = generateFallbackData()
      setChartData(fallbackData)
      
      // Notify parent component with fallback data
      if (onDataReady) {
        console.log('📊 ChartPreview: Notificando parent com dados simulados')
        onDataReady(fallbackData, sql)
      }
    } finally {
      console.log('📊 ChartPreview: Finalizando loading')
      setLoading(false)
    }
  }

  // Auto-reload when configuration changes
  useEffect(() => {
    console.log('📊 ChartPreview: Configuração mudou, agendando reload')
    const timer = setTimeout(() => {
      loadChartData()
    }, 200) // Reduced debounce for faster response

    return () => clearTimeout(timer)
  }, [xAxis, yAxis, filters, selectedTable, chartType]) // Added chartType to dependencies

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
                className="bg-blue-500 h-full rounded"
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
                className="w-2 bg-blue-500 rounded-t"
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
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            <CardTitle className="text-base">Preview</CardTitle>
          </div>
          {loading && <RefreshCw className="w-4 h-4 animate-spin text-primary" />}
        </div>
        <CardDescription>
          Visualização em tempo real dos dados
        </CardDescription>
      </CardHeader>

      <CardContent>
        <div className="min-h-[200px]">
          {!canRender ? (
            <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
              <TrendingUp className="w-8 h-8 mb-2 opacity-50" />
              <p className="text-sm text-center">
                Configure eixo X e Y para ver preview
              </p>
              <p className="text-xs text-center opacity-70 mt-1">
                Arraste colunas do painel esquerdo
              </p>
            </div>
          ) : loading ? (
            <div className="flex items-center justify-center h-48">
              <div className="text-center">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-primary" />
                <p className="text-sm text-muted-foreground">Loading data...</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-48">
              <div className="text-center">
                <AlertCircle className="w-6 h-6 mx-auto mb-2 text-destructive" />
                <p className="text-sm text-destructive mb-2">Error loading data</p>
                <p className="text-xs text-muted-foreground">{error}</p>
              </div>
            </div>
          ) : chartData.length === 0 ? (
            <div className="flex items-center justify-center h-48">
              <div className="text-center">
                <TrendingUp className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm">No data found</p>
                <p className="text-xs text-muted-foreground">Try different columns or filters</p>
              </div>
            </div>
          ) : (
            <div>
              {renderChart()}
              
              {/* Data info */}
              <div className="mt-4 pt-3 border-t flex items-center justify-between">
                <div className="flex gap-2">
                  <Badge variant="secondary" className="text-xs">
                    {chartData.length} records
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {selectedTable}
                  </Badge>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Generated Code */}
        {generateChartCode() && (
          <details className="mt-4">
            <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground flex items-center gap-2">
              View Generated Code
              <Badge variant="outline" className="text-xs">JavaScript</Badge>
            </summary>
            <Card className="mt-2 bg-muted/50">
              <CardContent className="p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-muted-foreground">Programmatic chart creation</span>
                  <button
                    onClick={copyCodeToClipboard}
                    className="text-xs px-2 py-1 bg-background hover:bg-accent rounded border transition-colors"
                  >
                    Copy Code
                  </button>
                </div>
                <pre className="text-xs font-mono overflow-x-auto whitespace-pre-wrap">
                  {generateChartCode()}
                </pre>
              </CardContent>
            </Card>
          </details>
        )}

        {/* Query Preview */}
        {query && (
          <details className="mt-4">
            <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
              View SQL Query
            </summary>
            <Card className="mt-2 bg-muted/50">
              <CardContent className="p-3">
                <pre className="text-xs font-mono overflow-x-auto whitespace-pre-wrap">
                  {query}
                </pre>
              </CardContent>
            </Card>
          </details>
        )}
      </CardContent>
    </Card>
  )
}