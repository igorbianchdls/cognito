'use client'

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

// Types for pre-selected fields
interface SelectedField {
  name: string
  type: string
  sourceTable: string
}

interface ChartBigQueryUpdateProps {
  // Selected widget to access bigqueryData
  selectedWidget: any // Will be cast to DroppedWidget internally
  
  // Current chart fields (from existing chart config)
  currentXAxisFields?: SelectedField[]
  currentYAxisFields?: SelectedField[]
  currentFilterFields?: SelectedField[]
  
  // Handlers
  onChartDragEnd: (event: DragEndEvent) => void
  onRemoveChartField: (dropZoneType: string, fieldName: string) => void
  onUpdateChartData: () => void
  hasChartChanged: boolean
}

export default function ChartBigQueryUpdate({
  selectedWidget,
  currentXAxisFields = [],
  currentYAxisFields = [],
  currentFilterFields = [],
  onChartDragEnd,
  onRemoveChartField,
  onUpdateChartData,
  hasChartChanged
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

  // SQL Query functionality (implemented internally like TableBigQueryUpdate)
  const getSavedChartQuery = (): string => {
    return selectedWidget?.bigqueryData?.query || ''
  }

  const onShowSqlModal = (query: string) => {
    // TODO: Implement SQL modal display
    console.log('Show SQL Modal:', query)
  }

  // Combine current chart fields with staged fields
  const combinedXAxis = [...currentXAxisFields, ...stagedXAxis]
  const combinedYAxis = [...currentYAxisFields, ...stagedYAxis]
  const combinedFilters = [...currentFilterFields, ...stagedFilters]

  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-900 mb-3">📊 Chart Data Fields</h3>
      <DndContext onDragEnd={onChartDragEnd}>
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
              onRemoveField={(fieldName) => onRemoveChartField('xAxis', fieldName)}
              acceptedTypes={['string', 'date', 'numeric']}
            />
            
            <DropZone
              id="chart-y-axis-drop-zone"
              label="Eixo Y"
              description="Drag numeric fields for aggregation"
              icon={<Database className="w-4 h-4 text-blue-600" />}
              fields={combinedYAxis}
              onRemoveField={(fieldName) => onRemoveChartField('yAxis', fieldName)}
              acceptedTypes={['numeric']}
            />
            
            <DropZone
              id="chart-filters-drop-zone"
              label="Filters"
              description="Drag any fields to create filters"
              icon={<Database className="w-4 h-4 text-orange-600" />}
              fields={combinedFilters}
              onRemoveField={(fieldName) => onRemoveChartField('filters', fieldName)}
              acceptedTypes={['string', 'date', 'numeric', 'boolean']}
            />
          </div>

          {/* Update Chart Button */}
          {hasChartChanged && (
            <div className="mt-4">
              <button
                onClick={onUpdateChartData}
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
          {getSavedChartQuery() && (
            <div className="mt-4 space-y-2">
              <Button
                onClick={() => onShowSqlModal(getSavedChartQuery())}
                variant="outline"
                size="sm"
                className="w-full text-xs"
              >
                <Eye className="w-3 h-3 mr-2" />
                View SQL Query
              </Button>
            </div>
          )}
        </div>
      </DndContext>
    </div>
  )
}