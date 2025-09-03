'use client'

import { useState, useEffect } from 'react'
import { useStore } from '@nanostores/react'
import { 
  chartActions, 
  $availableTables, 
  $selectedTable, 
  $tableColumns, 
  $loadingTables, 
  $loadingColumns, 
  $loadingChartUpdate,
  $stagedXAxis,
  $stagedYAxis, 
  $stagedFilters
} from '@/stores/apps/chartStore'
import { DndContext, DragEndEvent } from '@dnd-kit/core'
import { Database, RefreshCw, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import DropZone from '../builder/DropZone'
import DraggableColumn from '../builder/DraggableColumn'
import type { DroppedWidget } from '@/types/apps/widget'

// Types for pre-selected fields
interface SelectedField {
  name: string
  type: string
  sourceTable: string
}

interface ChartBigQueryUpdateProps {
  // Selected widget to access bigqueryData
  selectedWidget: DroppedWidget | null
  
  // Current chart fields (from existing chart config)
  currentXAxisFields?: SelectedField[]
  currentYAxisFields?: SelectedField[]
  currentFilterFields?: SelectedField[]
}

export default function ChartBigQueryUpdate({
  selectedWidget,
  currentXAxisFields = [],
  currentYAxisFields = [],
  currentFilterFields = []
}: ChartBigQueryUpdateProps) {
  // Chart data management (using store)
  const availableTables = useStore($availableTables)
  const selectedTable = useStore($selectedTable)
  const tableColumns = useStore($tableColumns)
  const loadingTables = useStore($loadingTables)
  const loadingColumns = useStore($loadingColumns)
  const loadingChartUpdate = useStore($loadingChartUpdate)
  const stagedXAxis = useStore($stagedXAxis)
  const stagedYAxis = useStore($stagedYAxis)
  const stagedFilters = useStore($stagedFilters)

  // SQL text display state
  const [showSqlText, setShowSqlText] = useState(false)
  
  // Updated query states (like TableBigQueryUpdate)
  const [updatedChartQuery, setUpdatedChartQuery] = useState<string>('')
  const [hasUpdatedChartQuery, setHasUpdatedChartQuery] = useState(false)

  // SQL Query functionality (implemented internally like TableBigQueryUpdate)
  const getSavedChartQuery = (): string => {
    return selectedWidget?.bigqueryData?.query || ''
  }

  const onShowSqlModal = (query: string) => {
    setShowSqlText(true)
  }

  // Chart logic functions (moved from WidgetEditorNew for better organization)
  const hasChartChanged = () => {
    if (!selectedWidget || !selectedWidget.type?.startsWith('chart')) return false
    
    // For now, simplify to just check if there are any staged fields
    // This will show the button when user drags fields to staging areas
    return stagedXAxis.length > 0 || stagedYAxis.length > 0 || stagedFilters.length > 0
  }

  // Handle drag end for chart fields
  const handleChartDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    
    if (!over || !active.data.current) return

    const draggedColumn = active.data.current as any
    const dropZoneId = over.id as string

    // Add to appropriate staging area using store actions
    switch (dropZoneId) {
      case 'chart-x-axis-drop-zone':
        chartActions.addToStagingArea(draggedColumn, 'xAxis')
        break
      case 'chart-y-axis-drop-zone':
        chartActions.addToStagingArea(draggedColumn, 'yAxis')
        break
      case 'chart-filters-drop-zone':
        chartActions.addToStagingArea(draggedColumn, 'filters')
        break
    }
  }

  // Handle remove field from staging areas
  const handleRemoveChartField = (dropZoneType: string, fieldName: string) => {
    chartActions.removeFromStagingArea(fieldName, dropZoneType as 'xAxis' | 'yAxis' | 'filters')
  }

  // Update chart data with staged fields
  const updateChartData = async () => {
    if (!selectedWidget || !selectedWidget.type?.startsWith('chart')) return
    
    await chartActions.updateChartWithStagedData(selectedWidget.i)
  }

  // Generate updated chart query based on current + staged fields (like generateUpdatedQuery in table)
  const generateUpdatedChartQuery = (): string => {
    const baseQuery = getSavedChartQuery()
    const tableInfo = selectedWidget?.bigqueryData
    if (!tableInfo?.table) return ''
    
    // Get current fields (from existing chart config)
    const currentXAxisFieldNames = currentXAxisFields ? currentXAxisFields.map(field => field.name) : []
    const currentYAxisFieldNames = currentYAxisFields ? currentYAxisFields.map(field => field.name) : []
    const currentFilterFieldNames = currentFilterFields ? currentFilterFields.map(field => field.name) : []
    
    // Get staged fields (new fields being added)
    const stagedXAxisFields = stagedXAxis.map(field => field.name)
    const stagedYAxisFields = stagedYAxis.map(field => field.name)
    const stagedFilterFields = stagedFilters.map(field => field.name)
    
    // Combine current + staged fields (like table does)
    const allFields = [
      ...currentXAxisFieldNames,
      ...currentYAxisFieldNames, 
      ...currentFilterFieldNames,
      ...stagedXAxisFields,
      ...stagedYAxisFields,
      ...stagedFilterFields
    ]
    
    // Remove duplicates
    const uniqueFields = [...new Set(allFields)]
    
    if (uniqueFields.length === 0) return baseQuery || ''
    
    // Create new query with ALL fields (current + staged) - using correct FROM format like table
    const selectFields = uniqueFields.join(', ')
    const newQuery = `
SELECT ${selectFields}
FROM \`creatto-463117.biquery_data.${tableInfo.table}\`
LIMIT 100
    `.trim()
    
    return newQuery
  }

  // Initialize chart fields (similar to TableConfigEditor useEffect)
  useEffect(() => {
    if (currentXAxisFields.length > 0 || currentYAxisFields.length > 0 || currentFilterFields.length > 0) {
      // Generate initial query for preview (but don't mark as having updates yet)
      const initialQuery = generateUpdatedChartQuery()
      setUpdatedChartQuery(initialQuery)
      setHasUpdatedChartQuery(false) // No changes yet, just showing current state
      
      console.log('🔄 Initialized chart fields with', currentXAxisFields.length + currentYAxisFields.length + currentFilterFields.length, 'current chart fields')
    } else {
      // No current fields, start with empty query
      setUpdatedChartQuery('')
      setHasUpdatedChartQuery(false)
    }
  }, [currentXAxisFields, currentYAxisFields, currentFilterFields])

  // Update query states when staged fields change (like TableBigQueryUpdate)  
  useEffect(() => {
    const hasChanges = stagedXAxis.length > 0 || stagedYAxis.length > 0 || stagedFilters.length > 0
    
    if (hasChanges) {
      const newQuery = generateUpdatedChartQuery()
      setUpdatedChartQuery(newQuery)
      setHasUpdatedChartQuery(true)
    } else {
      // Reset to initial state if no staged changes
      if (currentXAxisFields.length > 0 || currentYAxisFields.length > 0 || currentFilterFields.length > 0) {
        const initialQuery = generateUpdatedChartQuery()
        setUpdatedChartQuery(initialQuery)
        setHasUpdatedChartQuery(false)
      } else {
        setUpdatedChartQuery('')
        setHasUpdatedChartQuery(false)
      }
    }
  }, [stagedXAxis, stagedYAxis, stagedFilters, selectedWidget, currentXAxisFields, currentYAxisFields, currentFilterFields])

  // Combine current chart fields with staged fields
  const combinedXAxis = [...currentXAxisFields, ...stagedXAxis]
  const combinedYAxis = [...currentYAxisFields, ...stagedYAxis]
  const combinedFilters = [...currentFilterFields, ...stagedFilters]

  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-900 mb-3">📊 Chart Data Fields</h3>
      <DndContext onDragEnd={handleChartDragEnd}>
        <div className="space-y-4">
          {/* Tables & Columns Section */}
          <div className="grid grid-cols-2 gap-4">
            {/* Available Tables */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-medium text-gray-700">Available Tables</h4>
                <button
                  onClick={chartActions.loadTables}
                  disabled={loadingTables}
                  className="text-xs text-blue-600 hover:text-blue-800"
                >
                  <RefreshCw className={`w-3 h-3 ${loadingTables ? 'animate-spin' : ''}`} />
                </button>
              </div>
              <div className="border border-gray-200 rounded-lg h-32 overflow-y-auto">
                {loadingTables ? (
                  <div className="flex items-center justify-center h-full">
                    <RefreshCw className="w-4 h-4 animate-spin text-gray-400" />
                  </div>
                ) : (
                  <div className="p-2 space-y-1">
                    {availableTables.map((table) => {
                      const tableId = table.TABLEID || table.tableId || ''
                      return (
                        <div
                          key={tableId}
                          onClick={() => chartActions.selectTable(tableId)}
                          className={`text-xs p-2 rounded cursor-pointer transition-colors ${
                            selectedTable === tableId
                              ? 'bg-blue-100 text-blue-800'
                              : 'hover:bg-gray-100'
                          }`}
                        >
                          {tableId}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Table Columns */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-medium text-gray-700">Columns</h4>
                {loadingColumns && (
                  <RefreshCw className="w-3 h-3 animate-spin text-blue-600" />
                )}
              </div>
              <div className="border border-gray-200 rounded-lg h-32 overflow-y-auto">
                {selectedTable ? (
                  <div className="p-2 space-y-1">
                    {tableColumns.map((column) => (
                      <DraggableColumn
                        key={column.name}
                        field={column}
                        sourceTable={selectedTable}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full text-xs text-gray-500">
                    Select a table to view columns
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Drop Zones */}
          <div className="space-y-3">
            <DropZone
              id="chart-x-axis-drop-zone"
              label="Eixo X"
              description="Drag categorical fields (strings, dates)"
              icon={<Database className="w-4 h-4 text-green-600" />}
              fields={combinedXAxis}
              onRemoveField={(fieldName) => handleRemoveChartField('xAxis', fieldName)}
              acceptedTypes={['string', 'date', 'numeric']}
            />
            
            <DropZone
              id="chart-y-axis-drop-zone"
              label="Eixo Y"
              description="Drag numeric fields for aggregation"
              icon={<Database className="w-4 h-4 text-blue-600" />}
              fields={combinedYAxis}
              onRemoveField={(fieldName) => handleRemoveChartField('yAxis', fieldName)}
              acceptedTypes={['numeric']}
            />
            
            <DropZone
              id="chart-filters-drop-zone"
              label="Filters"
              description="Drag any fields to create filters"
              icon={<Database className="w-4 h-4 text-orange-600" />}
              fields={combinedFilters}
              onRemoveField={(fieldName) => handleRemoveChartField('filters', fieldName)}
              acceptedTypes={['string', 'date', 'numeric', 'boolean']}
            />
          </div>

          {/* Update Chart Button */}
          {hasChartChanged() && (
            <div className="mt-4">
              <button
                onClick={updateChartData}
                disabled={loadingChartUpdate}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 px-4 rounded-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loadingChartUpdate ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Updating Chart...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4" />
                    Update Chart
                  </>
                )}
              </button>
            </div>
          )}

          {/* SQL Query Buttons */}
          {(getSavedChartQuery() || hasUpdatedChartQuery) && (
            <div className="mt-4 space-y-2">
              {hasUpdatedChartQuery && (
                <Button
                  onClick={() => onShowSqlModal(updatedChartQuery)}
                  variant="outline"
                  size="sm"
                  className="w-full text-xs bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
                >
                  <Eye className="w-3 h-3 mr-2" />
                  View Updated SQL Query
                </Button>
              )}
              
              {getSavedChartQuery() && (
                <Button
                  onClick={() => onShowSqlModal(getSavedChartQuery())}
                  variant="outline"
                  size="sm"
                  className="w-full text-xs"
                >
                  <Eye className="w-3 h-3 mr-2" />
                  View SQL Query
                </Button>
              )}
              
              {/* SQL Text Display */}
              {showSqlText && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium mb-2">SQL Query:</h4>
                  <pre className="text-xs bg-gray-50 p-3 rounded border font-mono whitespace-pre-wrap">
                    {hasUpdatedChartQuery && updatedChartQuery ? updatedChartQuery : getSavedChartQuery()}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
      </DndContext>
    </div>
  )
}