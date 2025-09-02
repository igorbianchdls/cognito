'use client'

import { useState, useEffect } from 'react'
import { RefreshCw, AlertCircle, TrendingUp } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import KPIWidget from '../widgets/components/KPIWidget'
import type { BigQueryField } from './TablesExplorer'

export interface KPIData {
  current_value: number
  total_records?: number
  [key: string]: string | number | boolean | null | undefined
}

interface KPIPreviewProps {
  kpiValue: BigQueryField[]
  filters: BigQueryField[]
  selectedTable: string | null
  onDataReady?: (data: KPIData[], query: string) => void
}

export default function KPIPreview({
  kpiValue,
  filters,
  selectedTable,
  onDataReady
}: KPIPreviewProps) {
  const [kpiData, setKpiData] = useState<KPIData[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState<string>('')

  // Get aggregation function for measure field
  const getAggregationFunction = (field: BigQueryField): string => {
    if (field.aggregation) return field.aggregation.toUpperCase()
    
    const lowerType = field.type.toLowerCase()
    if (lowerType.includes('string') || lowerType.includes('text')) {
      return 'COUNT'
    }
    return 'SUM' // Default for numeric fields
  }

  // Generate SQL query for KPI calculation (simplified)
  const generateQuery = () => {
    if (!selectedTable || kpiValue.length === 0) {
      return ''
    }

    // Build simple SELECT clause with KPI field aggregation
    const kpiField = kpiValue[0]
    const aggregation = getAggregationFunction(kpiField)
    
    // Build WHERE clause for filters
    let whereClause = ''
    if (filters.length > 0) {
      const filterConditions = filters.map(filter => {
        return `${filter.name} IS NOT NULL`
      }).join(' AND ')
      
      if (filterConditions) {
        whereClause = `WHERE ${filterConditions}`
      }
    }

    // Simple SQL without GROUP BY for single KPI value
    const sql = `
SELECT 
  ${aggregation}(${kpiField.name}) as current_value,
  COUNT(*) as total_records
FROM \`creatto-463117.biquery_data.${selectedTable}\`
${whereClause}
    `.trim()

    return sql
  }

  // Generate fallback data for preview when API fails
  const generateFallbackData = (): KPIData[] => {
    const kpiField = kpiValue[0]
    const baseValue = kpiField?.type.toLowerCase().includes('string') ? 150 : 4247
    
    return [{
      current_value: baseValue + Math.floor(Math.random() * 1000),
      total_records: 1847 + Math.floor(Math.random() * 500),
      kpi_name: kpiField?.name || 'Sample KPI',
      kpi_field: kpiField?.name || 'metric'
    }]
  }

  // Execute query and load KPI data
  const loadKPIData = async () => {
    console.log('📊 KPIPreview: loadKPIData iniciado', {
      selectedTable,
      kpiValueLength: kpiValue.length,
      kpiValue: kpiValue.map(k => ({ name: k.name, type: k.type, aggregation: k.aggregation }))
    })

    if (!selectedTable || kpiValue.length === 0) {
      console.log('📊 KPIPreview: Configuração incompleta, limpando dados')
      setKpiData([])
      setError(null)
      return
    }

    const sql = generateQuery()
    console.log('📊 KPIPreview: SQL gerado:', sql)
    setQuery(sql)
    setLoading(true)
    setError(null)

    try {
      console.log('📊 KPIPreview: Fazendo chamada para /api/bigquery')
      
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

      console.log('📊 KPIPreview: Resposta recebida', {
        status: response.status,
        ok: response.ok,
        statusText: response.statusText
      })

      if (!response.ok) {
        throw new Error(`API response: ${response.status} ${response.statusText}`)
      }

      const result = await response.json()
      console.log('📊 KPIPreview: Resultado parseado', {
        success: result.success,
        hasData: !!result.data,
        dataType: typeof result.data,
        hasDataArray: Array.isArray(result.data?.data),
        dataLength: result.data?.data?.length,
        error: result.error
      })

      if (result.success && result.data?.data && Array.isArray(result.data.data)) {
        const rawData = result.data.data as KPIData[]
        
        console.log('📊 KPIPreview: Dados KPI processados', {
          rawDataLength: rawData.length,
          sampleRow: rawData[0]
        })

        setKpiData(rawData)
        
        // Notify parent component
        if (onDataReady) {
          console.log('📊 KPIPreview: Notificando parent component')
          onDataReady(rawData, sql)
        }
      } else {
        const errorMsg = result.error || 'No data returned from KPI query'
        console.error('📊 KPIPreview: Erro no resultado', errorMsg)
        throw new Error(errorMsg)
      }
    } catch (err) {
      console.error('📊 KPIPreview: Erro na execução', err)
      
      // Check if it's an abort error (timeout)
      if (err instanceof Error && err.name === 'AbortError') {
        console.log('📊 KPIPreview: Timeout - usando dados simulados')
        setError('API timeout - usando dados simulados para preview')
      } else {
        console.log('📊 KPIPreview: Erro de API - usando dados simulados')
        setError('API indisponível - usando dados simulados para preview')
      }
      
      // Generate fallback data for preview
      const fallbackData = generateFallbackData()
      setKpiData(fallbackData)
      
      // Notify parent component with fallback data
      if (onDataReady) {
        console.log('📊 KPIPreview: Notificando parent com dados simulados')
        onDataReady(fallbackData, sql)
      }
    } finally {
      console.log('📊 KPIPreview: Finalizando loading')
      setLoading(false)
    }
  }

  // Auto-reload when configuration changes
  useEffect(() => {
    console.log('📊 KPIPreview: Configuração mudou, agendando reload')
    const timer = setTimeout(() => {
      loadKPIData()
    }, 200) // Fast response for KPI preview

    return () => clearTimeout(timer)
  }, [kpiValue, filters, selectedTable]) // React to changes

  // Create mock widget for preview
  const createPreviewWidget = () => {
    if (kpiData.length === 0) return null

    const kpiDataValue = kpiData[0]
    const kpiField = kpiValue[0]
    
    return {
      id: 'kpi-preview',
      name: 'KPI Preview',
      type: 'kpi',
      icon: '📊',
      description: 'KPI Preview',
      defaultWidth: 2,
      defaultHeight: 2,
      i: 'kpi-preview',
      x: 0,
      y: 0,
      w: 2,
      h: 2,
      config: {
        kpiConfig: {
          name: kpiField?.name || 'KPI',
          value: kpiDataValue.current_value,
          metric: kpiField?.name,
          calculation: getAggregationFunction(kpiField),
          unit: kpiField?.type.toLowerCase().includes('string') ? 'items' : '',
          showTarget: false,
          showTrend: false,
          visualizationType: 'card' as 'card' | 'display' | 'gauge',
          enableSimulation: false, // Force disable simulation
          dataSource: 'BigQuery Preview' // Mark as real data source
        }
      }
    }
  }

  // Check if ready to render
  const canRender = selectedTable && kpiValue.length > 0

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            <CardTitle className="text-base">KPI Preview</CardTitle>
          </div>
          {loading && <RefreshCw className="w-4 h-4 animate-spin text-primary" />}
        </div>
        <CardDescription>
          Visualização em tempo real do KPI calculado
        </CardDescription>
      </CardHeader>

      <CardContent>
        <div className="min-h-[200px]">
          {!canRender ? (
            <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
              <TrendingUp className="w-8 h-8 mb-2 opacity-50" />
              <p className="text-sm text-center">
                Configure valor do KPI para ver preview
              </p>
              <p className="text-xs text-center opacity-70 mt-1">
                Arraste um campo numérico para Valor KPI
              </p>
            </div>
          ) : loading ? (
            <div className="flex items-center justify-center h-48">
              <div className="text-center">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-primary" />
                <p className="text-sm text-muted-foreground">Calculando KPI...</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-48">
              <div className="text-center">
                <AlertCircle className="w-6 h-6 mx-auto mb-2 text-orange-500" />
                <p className="text-sm text-orange-600 mb-2">Usando dados simulados</p>
                <p className="text-xs text-muted-foreground">{error}</p>
              </div>
            </div>
          ) : kpiData.length === 0 ? (
            <div className="flex items-center justify-center h-48">
              <div className="text-center">
                <TrendingUp className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm">No KPI data found</p>
                <p className="text-xs text-muted-foreground">Try different KPI value or filters</p>
              </div>
            </div>
          ) : (
            <div>
              {/* KPI Preview */}
              <div className="mb-4">
                <p className="text-sm font-medium mb-2">
                  KPI Value: {kpiData[0].current_value?.toLocaleString('pt-BR')}
                  {kpiData[0].total_records && ` (${kpiData[0].total_records} records)`}
                </p>
                <div className="h-32 bg-gray-50 rounded-lg flex items-center justify-center">
                  {createPreviewWidget() && (
                    <div className="w-full h-full p-2">
                      <KPIWidget widget={createPreviewWidget()!} />
                    </div>
                  )}
                </div>
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