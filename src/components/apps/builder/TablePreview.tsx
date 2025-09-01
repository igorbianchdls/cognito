'use client'

import { useState, useEffect } from 'react'
import { RefreshCw, AlertCircle, Table } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import type { BigQueryField } from './TablesExplorer'

export interface TableData {
  [key: string]: string | number | boolean | null | undefined
}

interface TablePreviewProps {
  columns: BigQueryField[]
  filters: BigQueryField[]
  selectedTable: string | null
  onDataReady?: (data: TableData[], query: string) => void
}

export default function TablePreview({
  columns,
  filters,
  selectedTable,
  onDataReady
}: TablePreviewProps) {
  const [tableData, setTableData] = useState<TableData[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState<string>('')

  // Generate SQL query for table (individual records, not aggregated)
  const generateQuery = () => {
    if (!selectedTable || columns.length === 0) {
      return ''
    }

    // Build SELECT clause with column names
    const selectCols = columns.map(col => col.name)

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
LIMIT 100
    `.trim()

    return sql
  }

  // Generate fallback data for preview when API fails
  const generateFallbackData = (): TableData[] => {
    const sampleData: TableData[] = []
    
    // Generate 5 sample rows with data matching the selected columns
    for (let i = 1; i <= 5; i++) {
      const row: TableData = {}
      
      columns.forEach((col, colIndex) => {
        const lowerType = col.type.toLowerCase()
        
        if (lowerType.includes('string') || lowerType.includes('text')) {
          row[col.name] = `Sample ${col.name} ${i}`
        } else if (lowerType.includes('int') || lowerType.includes('numeric') || lowerType.includes('float')) {
          row[col.name] = Math.floor(Math.random() * 1000) + (i * 100)
        } else if (lowerType.includes('bool')) {
          row[col.name] = Math.random() > 0.5
        } else if (lowerType.includes('date') || lowerType.includes('timestamp')) {
          const date = new Date()
          date.setDate(date.getDate() - i)
          row[col.name] = date.toISOString().split('T')[0]
        } else {
          row[col.name] = `Value ${i}`
        }
      })
      
      sampleData.push(row)
    }
    
    return sampleData
  }

  // Execute query and load data
  const loadTableData = async () => {
    console.log('📋 TablePreview: loadTableData iniciado', {
      selectedTable,
      columnsLength: columns.length,
      columns: columns.map(c => ({ name: c.name, type: c.type }))
    })

    if (!selectedTable || columns.length === 0) {
      console.log('📋 TablePreview: Configuração incompleta, limpando dados')
      setTableData([])
      setError(null)
      return
    }

    const sql = generateQuery()
    console.log('📋 TablePreview: SQL gerado:', sql)
    setQuery(sql)
    setLoading(true)
    setError(null)

    try {
      console.log('📋 TablePreview: Fazendo chamada para /api/bigquery')
      
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

      console.log('📋 TablePreview: Resposta recebida', {
        status: response.status,
        ok: response.ok,
        statusText: response.statusText
      })

      if (!response.ok) {
        throw new Error(`API response: ${response.status} ${response.statusText}`)
      }

      const result = await response.json()
      console.log('📋 TablePreview: Resultado parseado', {
        success: result.success,
        hasData: !!result.data,
        dataType: typeof result.data,
        hasDataArray: Array.isArray(result.data?.data),
        dataLength: result.data?.data?.length,
        error: result.error
      })

      if (result.success && result.data?.data && Array.isArray(result.data.data)) {
        const rawData = result.data.data as TableData[]
        
        console.log('📋 TablePreview: Dados processados', {
          rawDataLength: rawData.length,
          sampleRow: rawData[0]
        })

        setTableData(rawData)
        
        // Notify parent component
        if (onDataReady) {
          console.log('📋 TablePreview: Notificando parent component')
          onDataReady(rawData, sql)
        }
      } else {
        const errorMsg = result.error || 'No data returned from query'
        console.error('📋 TablePreview: Erro no resultado', errorMsg)
        throw new Error(errorMsg)
      }
    } catch (err) {
      console.error('📋 TablePreview: Erro na execução', err)
      
      // Check if it's an abort error (timeout)
      if (err instanceof Error && err.name === 'AbortError') {
        console.log('📋 TablePreview: Timeout - usando dados simulados')
        setError('API timeout - usando dados simulados para preview')
      } else {
        console.log('📋 TablePreview: Erro de API - usando dados simulados')
        setError('API indisponível - usando dados simulados para preview')
      }
      
      // Generate fallback data for preview
      const fallbackData = generateFallbackData()
      setTableData(fallbackData)
      
      // Notify parent component with fallback data
      if (onDataReady) {
        console.log('📋 TablePreview: Notificando parent com dados simulados')
        onDataReady(fallbackData, sql)
      }
    } finally {
      console.log('📋 TablePreview: Finalizando loading')
      setLoading(false)
    }
  }

  // Auto-reload when configuration changes
  useEffect(() => {
    console.log('📋 TablePreview: Configuração mudou, agendando reload')
    const timer = setTimeout(() => {
      loadTableData()
    }, 200) // Fast response for table preview

    return () => clearTimeout(timer)
  }, [columns, filters, selectedTable]) // React to changes

  // Render mini table preview
  const renderTablePreview = () => {
    if (tableData.length === 0) return null

    const displayData = tableData.slice(0, 5) // Show max 5 rows
    const displayColumns = columns.slice(0, 4) // Show max 4 columns to fit

    return (
      <div className="border rounded-lg overflow-hidden">
        {/* Table Header */}
        <div className="bg-gray-50 border-b">
          <div className="flex">
            {displayColumns.map((col, index) => (
              <div 
                key={index}
                className="flex-1 px-3 py-2 text-xs font-medium text-gray-700 border-r last:border-r-0"
              >
                {col.name}
              </div>
            ))}
          </div>
        </div>
        
        {/* Table Body */}
        <div className="bg-white">
          {displayData.map((row, rowIndex) => (
            <div 
              key={rowIndex}
              className="flex border-b last:border-b-0 hover:bg-gray-50"
            >
              {displayColumns.map((col, colIndex) => (
                <div 
                  key={colIndex}
                  className="flex-1 px-3 py-2 text-xs text-gray-900 border-r last:border-r-0 truncate"
                  title={String(row[col.name])}
                >
                  {String(row[col.name])}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    )
  }

  // Check if ready to render
  const canRender = selectedTable && columns.length > 0

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Table className="w-4 h-4 text-primary" />
            <CardTitle className="text-base">Preview</CardTitle>
          </div>
          {loading && <RefreshCw className="w-4 h-4 animate-spin text-primary" />}
        </div>
        <CardDescription>
          Visualização em tempo real dos dados da tabela
        </CardDescription>
      </CardHeader>

      <CardContent>
        <div className="min-h-[200px]">
          {!canRender ? (
            <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
              <Table className="w-8 h-8 mb-2 opacity-50" />
              <p className="text-sm text-center">
                Configure colunas para ver preview da tabela
              </p>
              <p className="text-xs text-center opacity-70 mt-1">
                Arraste colunas do painel esquerdo
              </p>
            </div>
          ) : loading ? (
            <div className="flex items-center justify-center h-48">
              <div className="text-center">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-primary" />
                <p className="text-sm text-muted-foreground">Loading table data...</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-48">
              <div className="text-center">
                <AlertCircle className="w-6 h-6 mx-auto mb-2 text-orange-500" />
                <p className="text-sm text-orange-600 mb-2">Using simulated data</p>
                <p className="text-xs text-muted-foreground">{error}</p>
              </div>
            </div>
          ) : tableData.length === 0 ? (
            <div className="flex items-center justify-center h-48">
              <div className="text-center">
                <Table className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm">No data found</p>
                <p className="text-xs text-muted-foreground">Try different columns or filters</p>
              </div>
            </div>
          ) : (
            <div>
              {/* Mini Table Preview */}
              <div className="mb-4">
                <p className="text-sm font-medium mb-2">
                  Showing {Math.min(tableData.length, 5)} of {tableData.length} rows
                </p>
                {renderTablePreview()}
              </div>

              {/* SQL Query */}
              {query && (
                <div className="mt-4">
                  <p className="text-xs font-medium text-gray-700 mb-2">SQL Query:</p>
                  <pre className="bg-gray-100 p-2 rounded text-xs overflow-x-auto">
                    {query}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}