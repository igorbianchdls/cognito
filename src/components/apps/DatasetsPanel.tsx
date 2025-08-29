'use client'

import { useState, useEffect } from 'react'
import { Table2, Hash, Calendar, AlertCircle, RefreshCw, HardDrive, ChevronRight, ChevronDown, Type, FileText, ToggleLeft, Calendar as CalendarIcon } from 'lucide-react'

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

interface BigQueryField {
  name: string
  type: string
  mode?: string
  description?: string
}

export default function DatasetsPanel() {
  const [tables, setTables] = useState<BigQueryTable[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Schema expansion states
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null)
  const [tableSchemas, setTableSchemas] = useState<Record<string, BigQueryField[]>>({})
  const [loadingSchema, setLoadingSchema] = useState<string | null>(null)
  const [schemaError, setSchemaError] = useState<string | null>(null)

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
      // Already have schema cached
      return
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
      // Collapse if already expanded
      setSelectedTableId(null)
    } else {
      // Expand and load schema
      setSelectedTableId(tableId)
      await loadTableSchema(tableId)
    }
  }

  // Load tables on component mount
  useEffect(() => {
    loadTables()
  }, [])

  const formatDate = (date?: Date | string) => {
    if (!date) return 'N/A'
    const dateObj = typeof date === 'string' ? new Date(date) : date
    return dateObj.toLocaleDateString('pt-BR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

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

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'N/A'
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return parseFloat((bytes / Math.pow(1024, i)).toFixed(1)) + ' ' + sizes[i]
  }

  // Get icon for field type
  const getFieldIcon = (type: string) => {
    const lowerType = type.toLowerCase()
    if (lowerType.includes('string') || lowerType.includes('text')) {
      return <FileText className="w-3 h-3" />
    }
    if (lowerType.includes('int') || lowerType.includes('numeric') || lowerType.includes('float')) {
      return <Hash className="w-3 h-3" />
    }
    if (lowerType.includes('date') || lowerType.includes('timestamp')) {
      return <CalendarIcon className="w-3 h-3" />
    }
    if (lowerType.includes('bool')) {
      return <ToggleLeft className="w-3 h-3" />
    }
    return <Type className="w-3 h-3" />
  }

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Table2 className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">Tabelas BigQuery</h2>
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
          <div className="p-4 space-y-3">
            {tables.map((table) => {
              // Support both API response formats
              const tableId = table.TABLEID || table.tableId || ''
              const numRows = table.NUMROWS || table.numRows
              const numBytes = table.NUMBYTES || table.numBytes
              const isExpanded = selectedTableId === tableId
              const isLoadingThisSchema = loadingSchema === tableId
              const schema = tableSchemas[tableId]
              
              return (
                <div
                  key={tableId}
                  className="border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-sm transition-all"
                >
                  {/* Table Header - Clickable */}
                  <div
                    onClick={() => handleTableClick(tableId)}
                    className="p-4 cursor-pointer"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4 text-gray-400" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-gray-400" />
                          )}
                          <Table2 className="w-4 h-4 text-blue-600 flex-shrink-0" />
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">
                            {tableId}
                          </h3>
                          <p className="text-xs text-gray-500 font-mono">biquery_data.{tableId}</p>
                        </div>
                      </div>
                      {isLoadingThisSchema && (
                        <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
                      )}
                    </div>

                    {/* Table Description */}
                    {table.description && (
                      <p className="text-sm text-gray-600 mb-3">{table.description}</p>
                    )}

                    {/* Table Stats */}
                    <div className="flex items-center gap-4 mb-3">
                      {numRows && (
                        <div className="flex items-center gap-1 text-sm text-blue-600 bg-blue-50 px-2 py-1 rounded">
                          <Hash className="w-3 h-3" />
                          <span>{formatRowCount(numRows)}</span>
                        </div>
                      )}
                      {numBytes && (
                        <div className="flex items-center gap-1 text-sm text-green-600 bg-green-50 px-2 py-1 rounded">
                          <HardDrive className="w-3 h-3" />
                          <span>{formatFileSize(numBytes)}</span>
                        </div>
                      )}
                    </div>

                    {/* Table Metadata */}
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      {table.creationTime && (
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>Criado: {formatDate(table.creationTime)}</span>
                        </div>
                      )}
                      {table.lastModifiedTime && (
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>Modificado: {formatDate(table.lastModifiedTime)}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Expandable Schema Section */}
                  {isExpanded && (
                    <div className="border-t border-gray-100 bg-gray-50">
                      <div className="p-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                          <Type className="w-4 h-4" />
                          Colunas ({schema ? schema.length : '...'})
                        </h4>
                        
                        {isLoadingThisSchema ? (
                          <div className="flex items-center gap-2 text-gray-500 py-4">
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            <span className="text-sm">Carregando schema...</span>
                          </div>
                        ) : schemaError ? (
                          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
                            <AlertCircle className="w-4 h-4" />
                            <span className="text-sm">{schemaError}</span>
                          </div>
                        ) : schema ? (
                          <div className="space-y-2 max-h-64 overflow-y-auto">
                            {schema.map((field, index) => (
                              <div
                                key={index}
                                className="flex items-center justify-between p-2 bg-white rounded border border-gray-100"
                              >
                                <div className="flex items-center gap-2">
                                  <span className="text-gray-500">
                                    {getFieldIcon(field.type)}
                                  </span>
                                  <div>
                                    <span className="text-sm font-medium text-gray-900">
                                      {field.name}
                                    </span>
                                    {field.description && (
                                      <p className="text-xs text-gray-500 mt-0.5">
                                        {field.description}
                                      </p>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 text-xs">
                                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded font-mono">
                                    {field.type}
                                  </span>
                                  {field.mode && field.mode !== 'NULLABLE' && (
                                    <span className="px-2 py-1 bg-red-100 text-red-800 rounded">
                                      {field.mode}
                                    </span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500 py-4">
                            Clique para carregar o schema desta tabela
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