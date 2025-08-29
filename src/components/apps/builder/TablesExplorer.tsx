'use client'

import { useState, useEffect } from 'react'
import { Table2, Database, RefreshCw, AlertCircle, ChevronRight, ChevronDown } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
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
    <div className="h-full flex flex-col">
      {/* Header Card */}
      <Card className="border-0 border-b rounded-none">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-primary" />
                <CardTitle className="text-lg">Tables</CardTitle>
                <Badge variant="secondary" className="text-xs">
                  {tables.length}
                </Badge>
              </div>
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
          <CardDescription>
            Arraste colunas para o Chart Builder
          </CardDescription>
        </CardHeader>
      </Card>

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
          <ScrollArea className="h-[calc(100vh-8rem)]">
            <div className="px-3 py-2 space-y-1">
              {tables.map((table) => {
                const tableId = table.TABLEID || table.tableId || ''
                const numRows = table.NUMROWS || table.numRows
                const isExpanded = selectedTableId === tableId
                const isLoadingThisSchema = loadingSchema === tableId
                const schema = tableSchemas[tableId]
                
                return (
                  <div key={tableId}>
                    {/* Table Header - Clickable */}
                    <div
                      onClick={() => handleTableClick(tableId)}
                      className={`flex items-center gap-2 px-2 py-2 rounded-md cursor-pointer transition-colors ${
                        isExpanded ? 'bg-muted/50' : 'hover:bg-muted/30'
                      }`}
                    >
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      )}
                      <Table2 className="w-4 h-4 text-primary flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">
                          {tableId}
                        </div>
                        {numRows && (
                          <div className="text-xs text-muted-foreground">
                            {formatRowCount(numRows)}
                          </div>
                        )}
                      </div>
                      {isLoadingThisSchema && (
                        <RefreshCw className="w-4 h-4 animate-spin text-primary flex-shrink-0" />
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
                          <div className="space-y-1">
                            <div className="py-1">
                              <span className="text-xs text-muted-foreground">
                                {schema.length} columns - drag to Chart Builder →
                              </span>
                            </div>
                            <ScrollArea className="max-h-64">
                              <div className="space-y-1">
                                {schema.map((field, index) => (
                                  <DraggableColumn
                                    key={index}
                                    field={field}
                                    sourceTable={tableId}
                                  />
                                ))}
                              </div>
                            </ScrollArea>
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
    </div>
  )
}