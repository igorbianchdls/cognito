'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { RefreshCw, Database, Play, Trash2, Plus } from 'lucide-react'
import { kpiActions } from '@/stores/apps/kpiStore'
import type { DroppedWidget } from '@/types/apps/droppedWidget'
import type { KPIConfig, BigQueryField } from '@/types/apps/kpiWidgets'

interface KPIDataSourceEditorProps {
  selectedWidget: DroppedWidget
  kpiConfig: KPIConfig
  onKPIConfigChange: (field: string, value: unknown) => void
}

// Mock tables - in real app would come from API
const mockTables = [
  'customers',
  'orders', 
  'products',
  'sales_data',
  'user_analytics'
]

// Mock fields for selected table - in real app would come from API
const mockTableFields: Record<string, BigQueryField[]> = {
  'sales_data': [
    { name: 'revenue', type: 'NUMERIC', aggregation: 'SUM' },
    { name: 'quantity', type: 'INTEGER', aggregation: 'COUNT' },
    { name: 'customer_id', type: 'STRING' },
    { name: 'sale_date', type: 'DATE' },
    { name: 'region', type: 'STRING' }
  ],
  'orders': [
    { name: 'order_value', type: 'NUMERIC', aggregation: 'SUM' },
    { name: 'order_id', type: 'STRING' },
    { name: 'customer_id', type: 'STRING' },
    { name: 'status', type: 'STRING' }
  ],
  'customers': [
    { name: 'customer_count', type: 'INTEGER', aggregation: 'COUNT' },
    { name: 'name', type: 'STRING' },
    { name: 'email', type: 'STRING' },
    { name: 'created_at', type: 'TIMESTAMP' }
  ]
}

export default function KPIDataSourceEditor({ 
  selectedWidget, 
  kpiConfig, 
  onKPIConfigChange 
}: KPIDataSourceEditorProps) {
  const [availableFields, setAvailableFields] = useState<BigQueryField[]>([])
  const [selectedTable, setSelectedTable] = useState<string | null>(
    kpiConfig.bigqueryData?.selectedTable || null
  )

  // Update available fields when table changes
  useEffect(() => {
    if (selectedTable && mockTableFields[selectedTable]) {
      setAvailableFields(mockTableFields[selectedTable])
    } else {
      setAvailableFields([])
    }
  }, [selectedTable])

  // Handle table selection
  const handleTableChange = (table: string) => {
    setSelectedTable(table)
    onKPIConfigChange('bigqueryData.selectedTable', table)
    
    // Clear existing fields when table changes
    onKPIConfigChange('bigqueryData.kpiValueFields', [])
    onKPIConfigChange('bigqueryData.filterFields', [])
  }

  // Handle data source type toggle
  const handleDataSourceTypeChange = (type: 'manual' | 'bigquery') => {
    onKPIConfigChange('dataSourceType', type)
    if (selectedWidget.i) {
      kpiActions.toggleKPIDataSourceType(selectedWidget.i, type)
    }
  }

  // Add field to KPI Value
  const handleAddKPIValueField = (field: BigQueryField) => {
    const currentFields = kpiConfig.bigqueryData?.kpiValueFields || []
    const newFields = [...currentFields, field]
    onKPIConfigChange('bigqueryData.kpiValueFields', newFields)
    
    // Generate and update query
    updateQuery(newFields, kpiConfig.bigqueryData?.filterFields || [])
  }

  // Add field to Filters
  const handleAddFilterField = (field: BigQueryField) => {
    const currentFields = kpiConfig.bigqueryData?.filterFields || []
    const newFields = [...currentFields, field]
    onKPIConfigChange('bigqueryData.filterFields', newFields)
    
    // Generate and update query
    updateQuery(kpiConfig.bigqueryData?.kpiValueFields || [], newFields)
  }

  // Remove KPI Value field
  const handleRemoveKPIValueField = (fieldName: string) => {
    const currentFields = kpiConfig.bigqueryData?.kpiValueFields || []
    const newFields = currentFields.filter(f => f.name !== fieldName)
    onKPIConfigChange('bigqueryData.kpiValueFields', newFields)
    
    updateQuery(newFields, kpiConfig.bigqueryData?.filterFields || [])
  }

  // Remove Filter field  
  const handleRemoveFilterField = (fieldName: string) => {
    const currentFields = kpiConfig.bigqueryData?.filterFields || []
    const newFields = currentFields.filter(f => f.name !== fieldName)
    onKPIConfigChange('bigqueryData.filterFields', newFields)
    
    updateQuery(kpiConfig.bigqueryData?.kpiValueFields || [], newFields)
  }

  // Update query when fields change
  const updateQuery = (kpiValueFields: BigQueryField[], filterFields: BigQueryField[]) => {
    if (selectedTable) {
      const query = kpiActions.generateKPIQuery(kpiValueFields, filterFields, selectedTable)
      onKPIConfigChange('bigqueryData.query', query)
    }
  }

  // Execute query
  const handleExecuteQuery = async () => {
    if (selectedWidget.i) {
      await kpiActions.executeKPIQuery(selectedWidget.i)
    }
  }

  // Get field icon
  const getFieldIcon = (type: string) => {
    const lowerType = type.toLowerCase()
    if (lowerType.includes('string') || lowerType.includes('text')) return '🔤'
    if (lowerType.includes('int') || lowerType.includes('numeric') || lowerType.includes('float')) return '🔢'
    if (lowerType.includes('date') || lowerType.includes('timestamp')) return '📅'
    if (lowerType.includes('bool')) return '✓'
    return '📊'
  }

  const bigqueryData = kpiConfig.bigqueryData
  const dataSourceType = kpiConfig.dataSourceType || 'manual'

  return (
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
            <Select value={selectedTable || ''} onValueChange={handleTableChange}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a table..." />
              </SelectTrigger>
              <SelectContent>
                {mockTables.map(table => (
                  <SelectItem key={table} value={table}>
                    📊 {table}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedTable && (
            <>
              {/* KPI Value Fields */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-2">KPI Value Field</label>
                
                {/* Current KPI Value Fields */}
                <div className="mb-2">
                  {bigqueryData?.kpiValueFields?.length ? (
                    <div className="flex flex-wrap gap-2">
                      {bigqueryData.kpiValueFields.map((field) => (
                        <div
                          key={field.name}
                          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium bg-purple-500 text-white"
                        >
                          <span>{getFieldIcon(field.type)}</span>
                          <span>{field.name}</span>
                          {field.aggregation && <span>({field.aggregation})</span>}
                          <button
                            onClick={() => handleRemoveKPIValueField(field.name)}
                            className="hover:bg-white/20 rounded-full p-0.5 transition-colors"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500 p-2 border-2 border-dashed rounded">
                      No KPI value field selected
                    </div>
                  )}
                </div>

                {/* Add KPI Value Field */}
                <div className="grid grid-cols-2 gap-2">
                  {availableFields
                    .filter(f => !bigqueryData?.kpiValueFields?.some(kf => kf.name === f.name))
                    .filter(f => f.type.toLowerCase().includes('int') || f.type.toLowerCase().includes('numeric'))
                    .map((field) => (
                    <button
                      key={field.name}
                      onClick={() => handleAddKPIValueField(field)}
                      className="flex items-center gap-2 p-2 text-sm border rounded hover:bg-gray-50 transition-colors"
                    >
                      <Plus className="w-3 h-3" />
                      <span>{getFieldIcon(field.type)}</span>
                      <span>{field.name}</span>
                      {field.aggregation && <span className="text-xs text-gray-500">({field.aggregation})</span>}
                    </button>
                  ))}
                </div>
              </div>

              {/* Filter Fields */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-2">Filter Fields (Optional)</label>
                
                {/* Current Filter Fields */}
                <div className="mb-2">
                  {bigqueryData?.filterFields?.length ? (
                    <div className="flex flex-wrap gap-2">
                      {bigqueryData.filterFields.map((field) => (
                        <div
                          key={field.name}
                          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium bg-orange-500 text-white"
                        >
                          <span>{getFieldIcon(field.type)}</span>
                          <span>{field.name}</span>
                          <button
                            onClick={() => handleRemoveFilterField(field.name)}
                            className="hover:bg-white/20 rounded-full p-0.5 transition-colors"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500 p-2 border-2 border-dashed rounded">
                      No filter fields selected
                    </div>
                  )}
                </div>

                {/* Add Filter Field */}
                <div className="grid grid-cols-2 gap-2">
                  {availableFields
                    .filter(f => !bigqueryData?.filterFields?.some(ff => ff.name === f.name))
                    .slice(0, 6) // Limit shown fields
                    .map((field) => (
                    <button
                      key={field.name}
                      onClick={() => handleAddFilterField(field)}
                      className="flex items-center gap-2 p-2 text-sm border rounded hover:bg-gray-50 transition-colors"
                    >
                      <Plus className="w-3 h-3" />
                      <span>{getFieldIcon(field.type)}</span>
                      <span>{field.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Query Preview & Execute */}
              {bigqueryData?.query && (
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-2">Generated Query</label>
                  <div className="bg-gray-50 p-3 rounded border text-xs font-mono">
                    {bigqueryData.query}
                  </div>
                  
                  <div className="flex items-center justify-between mt-2">
                    <div className="text-xs text-gray-500">
                      {bigqueryData.lastExecuted && (
                        <span>Last executed: {new Date(bigqueryData.lastExecuted).toLocaleString()}</span>
                      )}
                      {bigqueryData.error && (
                        <span className="text-red-500">Error: {bigqueryData.error}</span>
                      )}
                    </div>
                    
                    <Button 
                      size="sm" 
                      onClick={handleExecuteQuery}
                      disabled={bigqueryData.isLoading}
                      className="ml-2"
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
                <div className="bg-blue-50 p-3 rounded border">
                  <div className="text-sm font-medium text-blue-900 mb-1">Calculated Value</div>
                  <div className="text-2xl font-bold text-blue-600">
                    {bigqueryData.calculatedValue.toLocaleString()}
                  </div>
                  <div className="text-xs text-blue-700 mt-1">
                    From BigQuery • Auto-updates KPI when data source is BigQuery
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Manual Mode Instructions */}
      {dataSourceType === 'manual' && (
        <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded border">
          📝 Manual mode: Use the "Data & Values" section above to set KPI values manually.
        </div>
      )}
    </div>
  )
}