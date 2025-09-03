'use client'

import { Database, Grab, RefreshCw, Table2, BarChart3, AlertCircle, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import DropZone from '../builder/DropZone'
import DraggableColumn from '../builder/DraggableColumn'

// Types
interface BigQueryTable {
  tableId?: string
  TABLEID?: string
  numRows?: number | string
  NUMROWS?: number | string
}

interface BigQueryField {
  name: string
  type: string
  mode?: string
}

interface SelectedColumn {
  name: string
  type: string
  sourceTable: string
}

interface TableBigQueryUpdateProps {
  // Data states
  availableTables: BigQueryTable[]
  selectedTableForDimensions: string | null
  selectedTableSchema: BigQueryField[]
  selectedColumns: SelectedColumn[]
  
  // Loading states
  loadingSchema: boolean
  loadingTableSchema: boolean
  loadingUpdate: boolean
  
  // Handlers
  onTableSelect: (tableId: string) => void
  onRemoveSelectedColumn: (fieldName: string) => void
  onUpdateTableData: () => void
  
  // Query states
  hasColumnsChanged: () => boolean
  getSavedQuery: () => string
  hasUpdatedQuery: boolean
  updatedQuery: string
  
  // Modal handlers
  onShowSqlModal: (query: string) => void
}

export default function TableBigQueryUpdate({
  availableTables,
  selectedTableForDimensions,
  selectedTableSchema,
  selectedColumns,
  loadingSchema,
  loadingTableSchema,
  loadingUpdate,
  onTableSelect,
  onRemoveSelectedColumn,
  onUpdateTableData,
  hasColumnsChanged,
  getSavedQuery,
  hasUpdatedQuery,
  updatedQuery,
  onShowSqlModal
}: TableBigQueryUpdateProps) {
  
  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-900 mb-3">📊 Data & Columns</h3>
      
      <div className="grid grid-cols-2 gap-4">
        {/* Available Tables - Clickable List */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-2">
            <Database className="inline w-3 h-3 mr-1" />
            Available Tables ({availableTables.length})
          </label>
          <div className="max-h-64 border border-gray-200 rounded bg-white overflow-y-auto">
            <div className="space-y-1 p-2">
              {loadingSchema ? (
                <div className="flex items-center justify-center py-4">
                  <RefreshCw className="w-4 h-4 animate-spin text-gray-400" />
                  <span className="ml-2 text-xs text-gray-500">Loading tables...</span>
                </div>
              ) : availableTables.length > 0 ? (
                availableTables.map((table) => {
                  const tableId = table.tableId || table.TABLEID || ''
                  const isSelected = selectedTableForDimensions === tableId
                  
                  return (
                    <div
                      key={tableId}
                      className={`
                        cursor-pointer p-2 rounded text-xs transition-colors
                        ${isSelected 
                          ? 'bg-blue-100 border border-blue-300 text-blue-800' 
                          : 'hover:bg-gray-50 border border-transparent'
                        }
                      `}
                      onClick={() => onTableSelect(tableId)}
                    >
                      <div className="flex items-center gap-2">
                        <Table2 className="w-3 h-3 flex-shrink-0" />
                        <span className="font-medium truncate">{tableId}</span>
                      </div>
                      {table.numRows && (
                        <div className="text-xs text-gray-500 ml-5">
                          {typeof table.numRows === 'number' 
                            ? table.numRows.toLocaleString() 
                            : table.NUMROWS?.toLocaleString() || '0'
                          } rows
                        </div>
                      )}
                    </div>
                  )
                })
              ) : (
                <div className="text-xs text-gray-400 italic p-4 text-center">
                  No tables available
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Dimensions & Measures */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-2">
            <BarChart3 className="inline w-3 h-3 mr-1" />
            Dimensions & Measures
            {selectedTableForDimensions && (
              <span className="ml-1 text-blue-600">({selectedTableForDimensions})</span>
            )}
          </label>
          <div className="max-h-64 border border-gray-200 rounded bg-white overflow-y-auto">
            {!selectedTableForDimensions ? (
              <div className="flex items-center justify-center py-8 text-xs text-gray-400">
                <div className="text-center">
                  <BarChart3 className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  <p>Select a table to view dimensions</p>
                </div>
              </div>
            ) : loadingTableSchema ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="w-4 h-4 animate-spin text-gray-400" />
                <span className="ml-2 text-xs text-gray-500">Loading dimensions...</span>
              </div>
            ) : selectedTableSchema.length > 0 ? (
              <div className="space-y-1 p-2">
                {selectedTableSchema.map((field, index) => (
                  <DraggableColumn
                    key={`${selectedTableForDimensions}-${field.name}-${index}`}
                    field={field}
                    sourceTable={selectedTableForDimensions || ''}
                  />
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center py-8 text-xs text-gray-400">
                <div className="text-center">
                  <AlertCircle className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  <p>No dimensions available</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Selected Columns - Full Width */}
      <div className="mt-4">
        <DropZone
          id="selected-columns-drop-zone"
          label="Selected Columns"
          description="Drag columns here to add to your table"
          icon={<Grab className="w-4 h-4" />}
          fields={selectedColumns}
          onRemoveField={onRemoveSelectedColumn}
          className="w-full h-48"
        />
      </div>

      {/* Update Table Button */}
      {hasColumnsChanged() && (
        <div className="mt-4">
          <Button
            onClick={onUpdateTableData}
            disabled={loadingUpdate}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            {loadingUpdate ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Updating Table...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 mr-2" />
                Update Table
              </>
            )}
          </Button>
        </div>
      )}

      {/* SQL Query Buttons */}
      {(getSavedQuery() || hasUpdatedQuery) && (
        <div className="mt-4 space-y-2">
          {hasUpdatedQuery ? (
            <Button
              onClick={() => onShowSqlModal(updatedQuery)}
              variant="outline"
              size="sm"
              className="w-full text-xs bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
            >
              <Eye className="w-3 h-3 mr-2" />
              View Updated SQL Query
            </Button>
          ) : null}
          
          {getSavedQuery() && (
            <Button
              onClick={() => onShowSqlModal(getSavedQuery())}
              variant="outline"
              size="sm"
              className="w-full text-xs"
            >
              <Eye className="w-3 h-3 mr-2" />
              View SQL Query
            </Button>
          )}
        </div>
      )}
    </div>
  )
}