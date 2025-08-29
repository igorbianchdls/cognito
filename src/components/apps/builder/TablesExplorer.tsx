'use client'

import { useState, useEffect } from 'react'
import { Table2, Database, RefreshCw, AlertCircle, ChevronRight, ChevronDown } from 'lucide-react'
import DraggableColumn from './DraggableColumn'

export interface BigQueryField {
  name: string
  type: string
  mode?: string
  description?: string
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

export default function TablesExplorer() {
  const [tables, setTables] = useState<BigQueryTable[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Schema expansion states
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null)
  const [tableSchemas, setTableSchemas] = useState<Record<string, BigQueryField[]>>({})
  const [loadingSchema, setLoadingSchema] = useState<string | null>(null)
  const [schemaError, setSchemaError] = useState<string | null>(null)

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

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">Tables</h2>
            <span className="text-sm text-gray-500">({tables.length})</span>
          </div>
          <button
            onClick={loadTables}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {loading && tables.length === 0 ? (
          <div className="flex items-center justify-center h-32">
            <div className="flex items-center gap-2 text-gray-500">
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Carregando tabelas...</span>
            </div>
          </div>
        ) : error ? (
          <div className="p-4">
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm">{error}</span>
            </div>
          </div>
        ) : tables.length === 0 ? (
          <div className="flex items-center justify-center h-32">
            <div className="text-center text-gray-500">
              <Table2 className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Nenhuma tabela encontrada</p>
            </div>
          </div>
        ) : (
          <div className="p-4 space-y-2">
            {tables.map((table) => {
              const tableId = table.TABLEID || table.tableId || ''
              const numRows = table.NUMROWS || table.numRows
              const isExpanded = selectedTableId === tableId
              const isLoadingThisSchema = loadingSchema === tableId
              const schema = tableSchemas[tableId]
              
              return (
                <div
                  key={tableId}
                  className="border border-gray-200 rounded-lg hover:border-blue-300 transition-all"
                >
                  {/* Table Header - Clickable */}
                  <div
                    onClick={() => handleTableClick(tableId)}
                    className="p-3 cursor-pointer flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-gray-400" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                      )}
                      <Table2 className="w-4 h-4 text-blue-600" />
                      <div>
                        <h3 className="font-medium text-gray-900 text-sm">
                          {tableId}
                        </h3>
                        {numRows && (
                          <p className="text-xs text-gray-500">
                            {formatRowCount(numRows)}
                          </p>
                        )}
                      </div>
                    </div>
                    {isLoadingThisSchema && (
                      <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
                    )}
                  </div>

                  {/* Expandable Columns Section */}
                  {isExpanded && (
                    <div className="border-t border-gray-100 bg-gray-50">
                      <div className="p-3">
                        {isLoadingThisSchema ? (
                          <div className="flex items-center gap-2 text-gray-500 py-2">
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            <span className="text-sm">Carregando colunas...</span>
                          </div>
                        ) : schemaError ? (
                          <div className="flex items-center gap-2 p-2 bg-red-50 border border-red-200 rounded text-red-700">
                            <AlertCircle className="w-4 h-4" />
                            <span className="text-sm">{schemaError}</span>
                          </div>
                        ) : schema ? (
                          <div className="space-y-1">
                            <p className="text-xs font-medium text-gray-700 mb-2">
                              Columns ({schema.length}) - Drag to Chart Builder →
                            </p>
                            <div className="space-y-1 max-h-64 overflow-y-auto">
                              {schema.map((field, index) => (
                                <DraggableColumn
                                  key={index}
                                  field={field}
                                  sourceTable={tableId}
                                />
                              ))}
                            </div>
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500 py-2">
                            Click to load columns
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}