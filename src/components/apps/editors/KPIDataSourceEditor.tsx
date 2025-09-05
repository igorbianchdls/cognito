'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { RefreshCw, Database, Play, TrendingUp, Activity, AlertCircle } from 'lucide-react'
import { DndContext, DragEndEvent, useDraggable } from '@dnd-kit/core'
import { kpiActions } from '@/stores/apps/kpiStore'
import DropZone from '@/components/apps/builder/DropZone'
import type { DroppedWidget } from '@/types/apps/droppedWidget'
import type { KPIConfig, BigQueryField } from '@/types/apps/kpiWidgets'

interface KPIDataSourceEditorProps {
  selectedWidget: DroppedWidget
  kpiConfig: KPIConfig
  onKPIConfigChange: (field: string, value: unknown) => void
}

interface BigQueryTable {
  datasetId: string
  tableId: string
  projectId?: string
  description?: string
  numRows?: number
  numBytes?: number
  // Support for different API response formats
  DATASETID?: string
  TABLEID?: string
  NUMROWS?: number
  NUMBYTES?: number
}

// Draggable field component for table fields
interface DraggableFieldProps {
  field: BigQueryField
  sourceTable: string
}

function DraggableField({ field, sourceTable }: DraggableFieldProps) {
  const getFieldIcon = (type: string) => {
    const lowerType = type.toLowerCase()
    if (lowerType.includes('string') || lowerType.includes('text')) return '🔤'
    if (lowerType.includes('int') || lowerType.includes('numeric') || lowerType.includes('float')) return '🔢'
    if (lowerType.includes('date') || lowerType.includes('timestamp')) return '📅'
    if (lowerType.includes('bool')) return '✓'
    return '📊'
  }

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: field.name,
    data: { field, sourceTable }
  })

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    opacity: isDragging ? 0.5 : 1
  } : undefined

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className="flex items-center gap-2 p-2 text-sm border rounded cursor-grab hover:bg-gray-50 transition-colors active:cursor-grabbing"
    >
      <span>{getFieldIcon(field.type)}</span>
      <span className="flex-1 truncate">{field.name}</span>
      <span className="text-xs text-gray-500">{field.type}</span>
    </div>
  )
}

export default function KPIDataSourceEditor({ 
  selectedWidget, 
  kpiConfig, 
  onKPIConfigChange 
}: KPIDataSourceEditorProps) {
  // BigQuery data states
  const [tables, setTables] = useState<BigQueryTable[]>([])
  const [loadingTables, setLoadingTables] = useState(false)
  const [tablesError, setTablesError] = useState<string | null>(null)
  const [availableFields, setAvailableFields] = useState<BigQueryField[]>([])
  const [loadingFields, setLoadingFields] = useState(false)
  const [fieldsError, setFieldsError] = useState<string | null>(null)
  const [selectedTable, setSelectedTable] = useState<string | null>(
    kpiConfig.bigqueryData?.selectedTable || null
  )

  // Load BigQuery tables
  const loadTables = async () => {
    setLoadingTables(true)
    setTablesError(null)
    
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
      setTablesError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoadingTables(false)
    }
  }

  // Load table schema/fields
  const loadTableFields = async (tableId: string) => {
    setLoadingFields(true)
    setFieldsError(null)
    
    try {
      const response = await fetch(`/api/bigquery?action=schema&dataset=biquery_data&table=${tableId}`)
      const result = await response.json()
      
      if (result.success && Array.isArray(result.data)) {
        setAvailableFields(result.data)
      } else {
        throw new Error(result.error || 'Failed to load table schema')
      }
    } catch (err) {
      console.error('Error loading table fields:', err)
      setFieldsError(err instanceof Error ? err.message : 'Unknown error')
      setAvailableFields([])
    } finally {
      setLoadingFields(false)
    }
  }

  // Load tables on mount
  useEffect(() => {
    loadTables()
  }, [])

  // Load fields when table changes
  useEffect(() => {
    if (selectedTable) {
      loadTableFields(selectedTable)
    } else {
      setAvailableFields([])
    }
  }, [selectedTable])

  // Debug: Monitor kpiConfig changes
  useEffect(() => {
    console.log('📊 KPIDataSourceEditor kpiConfig updated:', {
      hasKpiConfig: !!kpiConfig,
      hasBigQueryData: !!kpiConfig.bigqueryData,
      kpiValueFields: kpiConfig.bigqueryData?.kpiValueFields,
      kpiValueFieldsCount: kpiConfig.bigqueryData?.kpiValueFields?.length || 0,
      filterFields: kpiConfig.bigqueryData?.filterFields,
      filterFieldsCount: kpiConfig.bigqueryData?.filterFields?.length || 0,
      selectedTable: kpiConfig.bigqueryData?.selectedTable,
      query: kpiConfig.bigqueryData?.query ? 'present' : 'missing',
      timestamp: Date.now()
    })
  }, [kpiConfig])

  // Handle table selection
  const handleTableChange = (table: string) => {
    setSelectedTable(table)
    onKPIConfigChange('bigqueryData.selectedTable', table)
    
    // Clear existing fields when table changes
    onKPIConfigChange('bigqueryData.kpiValueFields', [])
    onKPIConfigChange('bigqueryData.filterFields', [])
  }

  // Handle drag and drop
  const handleDragEnd = (event: DragEndEvent) => {
    console.log('🎯 KPIDataSourceEditor handleDragEnd triggered:', { 
      activeId: event.active.id,
      overId: event.over?.id,
      draggedData: event.active.data.current,
      timestamp: Date.now()
    })
    
    const { active, over } = event
    
    if (!over) {
      console.log('🎯 No drop target found')
      return
    }
    
    try {
      // Get field data from the dragged element
      const draggedData = active.data.current
      const field = draggedData?.field as BigQueryField
      
      console.log('🎯 Processing field drop:', {
        field: field ? { name: field.name, type: field.type } : null,
        targetZone: over.id,
        hasField: !!field
      })
      
      if (!field) {
        console.warn('🎯 No field data found in drag event')
        return
      }
      
      if (over.id === 'kpi-value-drop-zone') {
        console.log('🎯 Adding field to KPI Value zone:', field.name)
        // Add to KPI Value fields (only allow one field for KPI)
        onKPIConfigChange('bigqueryData.kpiValueFields', [field])
        console.log('🎯 KPI Value field added successfully:', field.name)
        
        // Update query
        updateQuery([field], kpiConfig.bigqueryData?.filterFields || [])
      } else if (over.id === 'filters-drop-zone') {
        console.log('🎯 Adding field to Filters zone:', field.name)
        // Add to filter fields (avoid duplicates)
        const currentFields = kpiConfig.bigqueryData?.filterFields || []
        const fieldExists = currentFields.some(f => f.name === field.name)
        
        if (!fieldExists) {
          const newFields = [...currentFields, field]
          onKPIConfigChange('bigqueryData.filterFields', newFields)
          console.log('🎯 Filter field added successfully:', field.name)
          
          // Update query
          updateQuery(kpiConfig.bigqueryData?.kpiValueFields || [], newFields)
        } else {
          console.log('🎯 Field already exists in filters:', field.name)
        }
      } else {
        console.log('🎯 Unknown drop zone:', over.id)
      }
    } catch (error) {
      console.error('🎯 Error handling drag and drop:', error)
    }
  }

  // Remove field from KPI Value
  const handleRemoveKPIValueField = (fieldName: string) => {
    console.log('🗑️ KPIDataSourceEditor removing KPI Value field:', fieldName)
    onKPIConfigChange('bigqueryData.kpiValueFields', [])
    updateQuery([], kpiConfig.bigqueryData?.filterFields || [])
    console.log('🗑️ KPI Value field removed successfully')
  }

  // Remove field from Filters
  const handleRemoveFilterField = (fieldName: string) => {
    console.log('🗑️ KPIDataSourceEditor removing Filter field:', fieldName)
    const currentFields = kpiConfig.bigqueryData?.filterFields || []
    const newFields = currentFields.filter(f => f.name !== fieldName)
    onKPIConfigChange('bigqueryData.filterFields', newFields)
    updateQuery(kpiConfig.bigqueryData?.kpiValueFields || [], newFields)
    console.log('🗑️ Filter field removed successfully:', { fieldName, remaining: newFields.length })
  }

  // Handle data source type toggle
  const handleDataSourceTypeChange = (type: 'manual' | 'bigquery') => {
    onKPIConfigChange('dataSourceType', type)
    if (selectedWidget.i) {
      kpiActions.toggleKPIDataSourceType(selectedWidget.i, type)
    }
  }


  // Update query when fields change
  const updateQuery = (kpiValueFields: BigQueryField[], filterFields: BigQueryField[]) => {
    if (selectedTable) {
      const query = kpiActions.generateKPIQuery(kpiValueFields, filterFields, selectedTable)
      onKPIConfigChange('bigqueryData.query', query)
    }
  }

  // Get table display name
  const getTableDisplayName = (table: BigQueryTable) => {
    return table.TABLEID || table.tableId || 'Unknown Table'
  }

  // Format row count
  const formatRowCount = (rows?: number) => {
    if (!rows) return ''
    if (rows >= 1000000) return `${(rows / 1000000).toFixed(1).replace('.0', '')}M rows`
    if (rows >= 1000) return `${(rows / 1000).toFixed(1).replace('.0', '')}k rows`
    return `${rows.toLocaleString()} rows`
  }

  // Execute query
  const handleExecuteQuery = async () => {
    if (selectedWidget.i) {
      await kpiActions.executeKPIQuery(selectedWidget.i)
    }
  }


  const bigqueryData = kpiConfig.bigqueryData
  const dataSourceType = kpiConfig.dataSourceType || 'manual'

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <div className="space-y-4">
        {/* Data Source Type Toggle */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-2">Data Source Type</label>
          <div className="flex gap-2">
            <Button
              variant={dataSourceType === 'manual' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleDataSourceTypeChange('manual')}
              className="flex-1"
            >
              ✍️ Manual Values
            </Button>
            <Button
              variant={dataSourceType === 'bigquery' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleDataSourceTypeChange('bigquery')}
              className="flex-1"
            >
              <Database className="w-4 h-4 mr-2" />
              BigQuery Data
            </Button>
          </div>
        </div>

        {/* BigQuery Configuration - only show when bigquery is selected */}
        {dataSourceType === 'bigquery' && (
          <div className="space-y-4 border-t pt-4">
            {/* Table Selection */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-2">Select Table</label>
              <div className="flex gap-2">
                <Select value={selectedTable || ''} onValueChange={handleTableChange} disabled={loadingTables}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder={loadingTables ? "Loading tables..." : "Choose a table..."} />
                  </SelectTrigger>
                  <SelectContent>
                    {tables.map(table => {
                      const tableId = getTableDisplayName(table)
                      const numRows = table.NUMROWS || table.numRows
                      return (
                        <SelectItem key={tableId} value={tableId}>
                          <div className="flex items-center gap-2">
                            <span>📊</span>
                            <span>{tableId}</span>
                            {numRows && (
                              <span className="text-xs text-gray-500">({formatRowCount(numRows)})</span>
                            )}
                          </div>
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadTables}
                  disabled={loadingTables}
                >
                  <RefreshCw className={`w-4 h-4 ${loadingTables ? 'animate-spin' : ''}`} />
                </Button>
              </div>
              {tablesError && (
                <div className="flex items-center gap-2 mt-2 p-2 text-sm text-red-600 bg-red-50 rounded">
                  <AlertCircle className="w-4 h-4" />
                  <span>{tablesError}</span>
                </div>
              )}
            </div>

            {/* Available Fields */}
            {selectedTable && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-medium text-gray-600">Available Fields</label>
                  {loadingFields && <RefreshCw className="w-4 h-4 animate-spin text-primary" />}
                </div>
                
                {fieldsError ? (
                  <div className="flex items-center gap-2 p-2 text-sm text-red-600 bg-red-50 rounded">
                    <AlertCircle className="w-4 h-4" />
                    <span>{fieldsError}</span>
                  </div>
                ) : (
                  <div className="max-h-48 overflow-y-auto border rounded p-2 bg-gray-50">
                    {availableFields.length > 0 ? (
                      <div className="grid grid-cols-1 gap-1">
                        {availableFields.map((field, index) => (
                          <DraggableField 
                            key={`${field.name}-${index}`} 
                            field={field} 
                            sourceTable={selectedTable} 
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="text-center text-sm text-gray-500 py-4">
                        {loadingFields ? 'Loading fields...' : 'No fields available'}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* DropZones for Field Selection */}
            {selectedTable && (
              <div className="space-y-3">
                {/* KPI Value Drop Zone */}
                <DropZone
                  id="kpi-value-drop-zone"
                  label="Valor KPI"
                  description="Campo numérico para calcular o KPI (apenas um campo)"
                  icon={<TrendingUp className="w-4 h-4 text-purple-600" />}
                  fields={bigqueryData?.kpiValueFields || []}
                  acceptedTypes={['numeric']}
                  onRemoveField={handleRemoveKPIValueField}
                />

                {/* Filters Drop Zone */}
                <DropZone
                  id="filters-drop-zone"
                  label="Filtros"
                  description="Campos para filtrar os dados do KPI (opcional)"
                  icon={<Activity className="w-4 h-4 text-orange-600" />}
                  fields={bigqueryData?.filterFields || []}
                  acceptedTypes={['string', 'date', 'numeric', 'boolean']}
                  onRemoveField={handleRemoveFilterField}
                />
              </div>
            )}

            {/* Collapsible SQL Query Preview */}
            {bigqueryData?.query && (
              <div>
                <details className="group">
                  <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-900 font-medium py-2">
                    <span className="inline-flex items-center gap-2">
                      <Database className="w-4 h-4" />
                      View SQL Query
                      <span className="text-xs text-gray-500">(Click to expand)</span>
                    </span>
                  </summary>
                  <Card className="mt-2 bg-gray-50/50">
                    <CardContent className="p-3">
                      <pre className="text-xs font-mono overflow-x-auto whitespace-pre-wrap text-gray-800">
                        {bigqueryData.query}
                      </pre>
                    </CardContent>
                  </Card>
                </details>
                
                {/* Execution Status and Button */}
                <div className="flex items-center justify-between mt-3 p-3 bg-blue-50 rounded border">
                  <div className="text-xs text-gray-600">
                    {bigqueryData.lastExecuted && (
                      <div>Last executed: {new Date(bigqueryData.lastExecuted).toLocaleString()}</div>
                    )}
                    {bigqueryData.error && (
                      <div className="text-red-600 font-medium">Error: {bigqueryData.error}</div>
                    )}
                  </div>
                  
                  <Button 
                    size="sm" 
                    onClick={handleExecuteQuery}
                    disabled={bigqueryData.isLoading}
                  >
                    {bigqueryData.isLoading ? (
                      <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <Play className="w-4 h-4 mr-2" />
                    )}
                    Execute Query
                  </Button>
                </div>
              </div>
            )}

            {/* Results */}
            {bigqueryData?.calculatedValue !== undefined && (
              <div className="bg-green-50 p-4 rounded border border-green-200">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                  <span className="text-sm font-medium text-green-900">Calculated KPI Value</span>
                </div>
                <div className="text-3xl font-bold text-green-600 mb-1">
                  {bigqueryData.calculatedValue.toLocaleString()}
                </div>
                <div className="text-xs text-green-700">
                  📊 From BigQuery • Auto-updates widget when data source is BigQuery
                </div>
              </div>
            )}
          </div>
        )}

        {/* Manual Mode Instructions */}
        {dataSourceType === 'manual' && (
          <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded border">
            📝 Manual mode: Use the &quot;Data &amp; Values&quot; section above to set KPI values manually.
          </div>
        )}
      </div>
    </DndContext>
  )
}