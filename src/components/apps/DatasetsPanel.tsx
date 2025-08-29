'use client'

import { useState, useEffect } from 'react'
import { Table2, Hash, Calendar, AlertCircle, RefreshCw, HardDrive } from 'lucide-react'

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

export default function DatasetsPanel() {
  const [tables, setTables] = useState<BigQueryTable[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
              
              return (
                <div
                  key={tableId}
                  className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-sm transition-all cursor-pointer"
                >
                  {/* Table Header */}
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Table2 className="w-4 h-4 text-blue-600 flex-shrink-0" />
                      <div>
                        <h3 className="font-medium text-gray-900">
                          {tableId}
                        </h3>
                        <p className="text-xs text-gray-500 font-mono">biquery_data.{tableId}</p>
                      </div>
                    </div>
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
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}