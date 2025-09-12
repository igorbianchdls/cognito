'use client'

import { useState, useEffect } from 'react'
import { Table2, Database, RefreshCw, AlertCircle, ChevronRight, ChevronDown, BarChart3, Plus, X } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { useStore } from '@nanostores/react'
import DraggableColumn from './DraggableColumn'
import DraggableMeasure from './DraggableMeasure'
import { measuresStore, measureActions } from '@/stores/apps/measureStore'

export interface BigQueryField {
  name: string
  type: string
  mode?: string
  description?: string
  aggregation?: 'SUM' | 'AVG' | 'COUNT' | 'MIN' | 'MAX' | 'COUNT_DISTINCT'
}

interface BigQueryTable {
  datasetId: string
  tableId: string
  projectId?: string
  description?: string
  numRows?: number
  numBytes?: number
  creationTime?: Date
  lastModifiedTime?: Date
  // Support for different API response formats
  DATASETID?: string
  TABLEID?: string
  NUMROWS?: number
  NUMBYTES?: number
}

interface TablesExplorerProps {
  compact?: boolean
  showMetadata?: boolean
  showMeasures?: boolean
  showHeader?: boolean
  className?: string
}

export default function TablesExplorer({
  compact = false,
  showMetadata = true,
  showMeasures = true,
  showHeader = true,
  className = ""
}: TablesExplorerProps) {
  const [tables, setTables] = useState<BigQueryTable[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Use measures store
  const allMeasures = useStore(measuresStore)
  
  // Schema expansion states
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null)
  const [tableSchemas, setTableSchemas] = useState<Record<string, BigQueryField[]>>({})
  const [loadingSchema, setLoadingSchema] = useState<string | null>(null)
  const [schemaError, setSchemaError] = useState<string | null>(null)
  
  // Section expansion states
  const [expandedDimensions, setExpandedDimensions] = useState<Record<string, boolean>>({})
  const [expandedMeasures, setExpandedMeasures] = useState<Record<string, boolean>>({})
  
  // Create measure modal states
  const [isCreateMeasureOpen, setIsCreateMeasureOpen] = useState(false)
  const [selectedTableForMeasure, setSelectedTableForMeasure] = useState<string | null>(null)
  const [selectedColumn, setSelectedColumn] = useState<string>('')
  const [selectedAggregation, setSelectedAggregation] = useState<string>('SUM')
  const [measureName, setMeasureName] = useState<string>('')

  // Load tables
  const loadTables = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/bigquery?action=tables&dataset=biquery_data')
      const result = await response.json()
      
      if (result.success && Array.isArray(result.data)) {
        setTables(result.data)
      } else {
        throw new Error(result.error || 'Failed to load tables')
      }
    } catch (err) {
      console.error('Error loading tables:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  // Load table schema
  const loadTableSchema = async (tableId: string) => {
    if (tableSchemas[tableId]) {
      return // Already cached
    }
    
    setLoadingSchema(tableId)
    setSchemaError(null)
    
    try {
      const response = await fetch(`/api/bigquery?action=schema&dataset=biquery_data&table=${tableId}`)
      const result = await response.json()
      
      if (result.success && Array.isArray(result.data)) {
        setTableSchemas(prev => ({
          ...prev,
          [tableId]: result.data
        }))
      } else {
        throw new Error(result.error || 'Failed to load table schema')
      }
    } catch (err) {
      console.error('Error loading table schema:', err)
      setSchemaError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoadingSchema(null)
    }
  }

  // Handle table click (expand/collapse)
  const handleTableClick = async (tableId: string) => {
    if (selectedTableId === tableId) {
      setSelectedTableId(null) // Collapse
    } else {
      setSelectedTableId(tableId) // Expand
      await loadTableSchema(tableId)
    }
  }

  // Load tables on mount
  useEffect(() => {
    loadTables()
  }, [])

  const formatRowCount = (rows?: number) => {
    if (!rows) return 'N/A'
    if (rows >= 1000000) {
      return (rows / 1000000).toFixed(1).replace('.0', '') + 'M rows'
    }
    if (rows >= 1000) {
      return (rows / 1000).toFixed(1).replace('.0', '') + 'k rows'
    }
    return rows.toLocaleString() + ' rows'
  }

  // Toggle section expansion
  const toggleDimensions = (tableId: string) => {
    setExpandedDimensions(prev => ({
      ...prev,
      [tableId]: !prev[tableId]
    }))
  }

  const toggleMeasures = (tableId: string) => {
    setExpandedMeasures(prev => ({
      ...prev,
      [tableId]: !prev[tableId]
    }))
  }

  // Handle create measure
  const handleCreateMeasure = (tableId: string) => {
    setSelectedTableForMeasure(tableId)
    setIsCreateMeasureOpen(true)
    // Reset form
    setSelectedColumn('')
    setSelectedAggregation('SUM')
    setMeasureName('')
  }

  const handleCloseMeasureModal = () => {
    setIsCreateMeasureOpen(false)
    setSelectedTableForMeasure(null)
    setSelectedColumn('')
    setSelectedAggregation('SUM')
    setMeasureName('')
  }

  const handleSaveMeasure = () => {
    if (!selectedColumn || !measureName || !selectedTableForMeasure) {
      alert('Por favor, preencha todos os campos')
      return
    }
    
    // Create measure using store actions
    measureActions.addMeasure({
      name: measureName,
      column: selectedColumn,
      aggregation: selectedAggregation as 'SUM' | 'AVG' | 'COUNT' | 'MAX' | 'MIN',
      tableId: selectedTableForMeasure
    })
    
    handleCloseMeasureModal()
  }

  // Get aggregation options
  const aggregationOptions = [
    { value: 'SUM', label: 'SUM' },
    { value: 'AVG', label: 'AVG' },
    { value: 'COUNT', label: 'COUNT' },
    { value: 'MAX', label: 'MAX' },
    { value: 'MIN', label: 'MIN' }
  ]

  return (
    <div className={`h-full flex flex-col relative overflow-hidden max-w-full ${className}`}>
      {/* Header - Conditional */}
      {showHeader && (
        <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex-shrink-0">
          <div className="flex items-center gap-2">
            <Database className="w-3 h-3 text-primary" />
            <h2 className={`font-semibold ${compact ? 'text-sm' : 'text-base'}`}>Tables</h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={loadTables}
            disabled={loading}
            className="gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      )}

      {/* Content */}
      <div className="flex-1">
        {loading && tables.length === 0 ? (
          <div className="flex items-center justify-center h-32">
            <div className="flex items-center gap-2 text-muted-foreground">
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Carregando tabelas...</span>
            </div>
          </div>
        ) : error ? (
          <div className="p-4">
            <Card className="border-destructive">
              <CardContent className="flex items-center gap-2 p-3">
                <AlertCircle className="w-4 h-4 text-destructive" />
                <span className="text-sm text-destructive">{error}</span>
              </CardContent>
            </Card>
          </div>
        ) : tables.length === 0 ? (
          <div className="flex items-center justify-center h-32">
            <div className="text-center text-muted-foreground">
              <Table2 className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Nenhuma tabela encontrada</p>
            </div>
          </div>
        ) : (
          <ScrollArea className="flex-1 overflow-x-hidden">
            <div className="px-3 py-2 space-y-1 overflow-x-hidden max-w-full">
              {tables.map((table) => {
                const tableId = table.TABLEID || table.tableId || ''
                const numRows = table.NUMROWS || table.numRows
                const isExpanded = selectedTableId === tableId
                const isLoadingThisSchema = loadingSchema === tableId
                const schema = tableSchemas[tableId]
                const tableMeasures = allMeasures[tableId] || []
                
                return (
                  <div key={tableId}>
                    {/* Table Header - Clickable */}
                    <div
                      onClick={() => handleTableClick(tableId)}
                      className={`flex items-center gap-2 ${compact ? 'px-1 py-0.5' : 'px-2 py-1'} rounded-md cursor-pointer transition-colors overflow-hidden ${
                        isExpanded ? 'bg-muted/50' : 'hover:bg-muted/30'
                      }`}
                    >
                      {isExpanded ? (
                        <ChevronDown className={`${compact ? 'w-3 h-3' : 'w-4 h-4'} text-muted-foreground flex-shrink-0`} />
                      ) : (
                        <ChevronRight className={`${compact ? 'w-3 h-3' : 'w-4 h-4'} text-muted-foreground flex-shrink-0`} />
                      )}
                      <Table2 
                        className={`${compact ? 'w-3 h-3' : 'w-4 h-4'} flex-shrink-0`} 
                        style={{ color: 'rgb(94, 94, 94)' }}
                      />
                      <div className="flex-1 min-w-0">
                        <div 
                          className={`${compact ? 'text-xs' : 'text-sm'} font-medium truncate`}
                          style={{ color: 'rgb(94, 94, 94)' }}
                        >
                          {tableId}
                        </div>
                      </div>
                      {isLoadingThisSchema && (
                        <RefreshCw className={`${compact ? 'w-3 h-3' : 'w-4 h-4'} animate-spin text-primary flex-shrink-0`} />
                      )}
                    </div>

                    {/* Expandable Columns Section */}
                    {isExpanded && (
                      <div className="mt-1 mb-2">
                        {isLoadingThisSchema ? (
                          <div className="flex items-center gap-2 text-muted-foreground py-2">
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            <span className="text-sm">Carregando colunas...</span>
                          </div>
                        ) : schemaError ? (
                          <div className="flex items-center gap-2 py-2 text-destructive">
                            <AlertCircle className="w-4 h-4" />
                            <span className="text-sm">{schemaError}</span>
                          </div>
                        ) : schema ? (
                          <div className="space-y-3">
                            {/* Dimensões Section */}
                            <div>
                              <div 
                                className="flex items-center gap-2 py-1 mb-2 cursor-pointer hover:bg-muted/30 rounded px-1 transition-colors overflow-hidden"
                                onClick={() => toggleDimensions(tableId)}
                              >
                                {expandedDimensions[tableId] ? (
                                  <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                                ) : (
                                  <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                                )}
                                <BarChart3 className="w-4 h-4 text-primary flex-shrink-0" />
                                <span className="text-sm font-medium text-foreground flex-1 truncate">Dimensões</span>
                                <Badge variant="outline" className="text-xs flex-shrink-0 ml-1">
                                  {schema.length}
                                </Badge>
                              </div>
                              {expandedDimensions[tableId] && (
                                <div className="h-128 overflow-y-auto overflow-x-hidden">
                                  <div className="space-y-1 ml-4 pr-2" style={{maxWidth: '200px'}}>
                                    {schema.map((field, index) => (
                                      <DraggableColumn
                                        key={index}
                                        field={field}
                                        sourceTable={tableId}
                                      />
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Medidas Section - Conditional */}
                            {showMeasures && (
                            <div>
                              <div 
                                className="flex items-center gap-2 py-1 mb-2 cursor-pointer hover:bg-muted/30 rounded px-1 transition-colors overflow-hidden"
                                onClick={() => toggleMeasures(tableId)}
                              >
                                {expandedMeasures[tableId] ? (
                                  <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                                ) : (
                                  <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                                )}
                                <BarChart3 className="w-4 h-4 text-green-600 flex-shrink-0" />
                                <span className="text-sm font-medium text-foreground flex-1 truncate">Medidas</span>
                                <Badge variant="outline" className="text-xs flex-shrink-0 ml-1">
                                  {tableMeasures.length}
                                </Badge>
                              </div>
                              {expandedMeasures[tableId] && (
                                <div className="ml-4 space-y-2 overflow-x-hidden" style={{maxWidth: '200px'}}>
                                  {/* Existing measures */}
                                  {tableMeasures.length > 0 && (
                                    <div className="space-y-1 overflow-x-hidden">
                                      {tableMeasures.map((measure) => (
                                        <DraggableMeasure
                                          key={measure.id}
                                          measure={measure}
                                        />
                                      ))}
                                    </div>
                                  )}
                                  
                                  {/* Create measure button */}
                                  <div className="px-2 py-2">
                                    <button 
                                      className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                                      onClick={() => handleCreateMeasure(tableId)}
                                    >
                                      <Plus className="w-4 h-4" />
                                      Criar Medida
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                            )}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground py-2">
                            Click to load columns
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </ScrollArea>
        )}
      </div>

      {/* Create Measure Modal */}
      {isCreateMeasureOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100]">
          <Card className="w-[500px] max-w-[90vw] relative z-[101]">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-primary" />
                  Criar Medida
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCloseMeasureModal}
                  className="h-6 w-6 p-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <CardDescription>
                Crie uma medida personalizada para {selectedTableForMeasure}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Column Selection */}
              <div className="space-y-2">
                <label htmlFor="column" className="text-sm font-medium">Coluna</label>
                <Select value={selectedColumn} onValueChange={setSelectedColumn}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma coluna" />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedTableForMeasure && tableSchemas[selectedTableForMeasure]?.map((column) => (
                      <SelectItem key={column.name} value={column.name}>
                        {column.name} ({column.type})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Aggregation Selection */}
              <div className="space-y-2">
                <label htmlFor="aggregation" className="text-sm font-medium">Agregação</label>
                <Select value={selectedAggregation} onValueChange={setSelectedAggregation}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {aggregationOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Measure Name */}
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium">Nome da Medida</label>
                <Input
                  id="name"
                  value={measureName}
                  onChange={(e) => setMeasureName(e.target.value)}
                  placeholder="Ex: Total Vendas"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={handleCloseMeasureModal}>
                  Cancelar
                </Button>
                <Button onClick={handleSaveMeasure}>
                  Salvar Medida
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}