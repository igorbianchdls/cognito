'use client'

import type { DroppedWidget } from '@/types/apps/widget'
import { isTableWidget } from '@/types/apps/tableWidgets'
import type { TableConfig, TableColumn } from '@/types/apps/tableWidgets'
import { useState, useEffect } from 'react'
import { DndContext, DragEndEvent } from '@dnd-kit/core'
import { Database, Grab, Trash2, Eye, X, RefreshCw } from 'lucide-react'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import DropZone from '../builder/DropZone'
import TablesExplorer from '../builder/TablesExplorer'
import type { BigQueryField } from '../builder/TablesExplorer'

// BigQuery table type
interface BigQueryTable {
  datasetId?: string
  tableId?: string
  TABLEID?: string
  DATASETID?: string
  numRows?: number
  NUMROWS?: number
  numBytes?: number
  NUMBYTES?: number
  description?: string
}

interface TableConfigEditorProps {
  selectedWidget: DroppedWidget
  tableConfig: TableConfig
  onTableConfigChange: (field: string, value: unknown) => void
}

export default function TableConfigEditor({ 
  selectedWidget, 
  tableConfig, 
  onTableConfigChange
}: TableConfigEditorProps) {
  const [availableTables, setAvailableTables] = useState<BigQueryTable[]>([])
  const [loadingSchema, setLoadingSchema] = useState(false)

  // Preview states
  const [previewTableId, setPreviewTableId] = useState<string | null>(null)
  const [previewData, setPreviewData] = useState<Record<string, Array<Record<string, unknown>>>>({})
  const [loadingPreview, setLoadingPreview] = useState<string | null>(null)
  const [showPreviewModal, setShowPreviewModal] = useState(false)

  // SQL Query states
  const [currentQuery, setCurrentQuery] = useState<string>('')
  const [showSqlModal, setShowSqlModal] = useState(false)

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    
    if (!over || !active.data.current) return

    const draggedColumn = active.data.current as BigQueryField & { sourceTable: string }
    const dropZoneId = over.id as string

    console.log('🔄 TableConfigEditor Drag ended:', { draggedColumn, dropZoneId })

    if (dropZoneId === 'selected-columns-drop-zone') {
      // Convert BigQuery field to TableColumn and add to table config
      const newTableColumn: TableColumn = {
        id: `col-${Date.now()}`,
        header: draggedColumn.name,
        accessorKey: draggedColumn.name,
        type: convertBigQueryTypeToTableType(draggedColumn.type),
        width: 120,
        sortable: true
      }
      
      const currentColumns = tableConfig.columns || []
      const alreadyExists = currentColumns.some(col => col.accessorKey === draggedColumn.name)
      
      if (!alreadyExists) {
        const updatedColumns = [...currentColumns, newTableColumn]
        onTableConfigChange('columns', updatedColumns)
        
        console.log('🔄 Column added to table:', draggedColumn.name)
      }
    }
  }

  const convertBigQueryTypeToTableType = (bigQueryType: string): TableColumn['type'] => {
    const lowerType = bigQueryType.toLowerCase()
    if (lowerType.includes('int') || lowerType.includes('numeric') || lowerType.includes('float')) {
      return 'number'
    }
    if (lowerType.includes('bool')) {
      return 'boolean'
    }
    if (lowerType.includes('date') || lowerType.includes('timestamp')) {
      return 'date'
    }
    return 'text'
  }

  // Load available tables
  const loadAvailableTables = async () => {
    try {
      const response = await fetch('/api/bigquery?action=tables&dataset=biquery_data')
      const result = await response.json()
      
      if (result.success && Array.isArray(result.data)) {
        setAvailableTables(result.data)
      }
    } catch (error) {
      console.error('Error loading tables:', error)
    }
  }



  // Load real data from BigQuery table
  const loadRealDataFromBigQuery = async (tableId: string) => {
    setLoadingSchema(true)
    
    try {
      console.log('📊 Loading real data from BigQuery table:', tableId)
      const response = await fetch(`/api/bigquery?action=query&dataset=biquery_data&table=${tableId}&limit=100`)
      const result = await response.json()
      
      if (result.success && Array.isArray(result.data)) {
        // Replace mock data with real BigQuery data
        console.log('✅ Real data loaded successfully:', result.data.length, 'rows')
        onTableConfigChange('data', result.data)
      } else {
        console.error('❌ Failed to load table data:', result.error)
      }
    } catch (error) {
      console.error('❌ Error loading BigQuery data:', error)
    } finally {
      setLoadingSchema(false)
    }
  }

  // Load preview data for a table
  const loadPreviewData = async (tableId: string) => {
    // Check if already cached
    if (previewData[tableId]) {
      setPreviewTableId(tableId)
      setShowPreviewModal(true)
      return
    }
    
    setLoadingPreview(tableId)
    
    try {
      console.log('📊 Loading preview data for table:', tableId)
      const response = await fetch(`/api/bigquery?action=query&dataset=biquery_data&table=${tableId}&limit=20`)
      const result = await response.json()
      
      if (result.success && Array.isArray(result.data)) {
        // Cache the preview data
        setPreviewData(prev => ({
          ...prev,
          [tableId]: result.data
        }))
        setPreviewTableId(tableId)
        setShowPreviewModal(true)
        console.log('✅ Preview data loaded successfully:', result.data.length, 'rows')
      } else {
        console.error('❌ Failed to load preview data:', result.error)
      }
    } catch (error) {
      console.error('❌ Error loading preview data:', error)
    } finally {
      setLoadingPreview(null)
    }
  }

  // Use table data from preview
  const handleUseTableData = async (tableId: string) => {
    console.log('🔄 Using data from table:', tableId)
    
    // Close preview modal
    setShowPreviewModal(false)
    
    // Load full data for the widget
    await loadRealDataFromBigQuery(tableId)
    
    // Auto-select some basic columns if preview data exists
    if (previewData[tableId] && previewData[tableId].length > 0) {
      const firstRow = previewData[tableId][0]
      const columnNames = Object.keys(firstRow).slice(0, 4) // Take first 4 columns
      
      const autoColumns = columnNames.map((name, index) => ({
        id: `col-auto-${Date.now()}-${index}`,
        header: name.charAt(0).toUpperCase() + name.slice(1),
        accessorKey: name,
        type: typeof firstRow[name] === 'number' ? 'number' as const : 'text' as const,
        width: 120,
        sortable: true
      }))
      
      onTableConfigChange('columns', autoColumns)
      console.log('✅ Auto-selected columns:', autoColumns.length)
    }
  }

  // Get saved SQL query from widget bigqueryData
  const getSavedQuery = (): string => {
    return selectedWidget?.bigqueryData?.query || ''
  }

  // Get saved table info from widget bigqueryData
  const getSavedTableInfo = () => {
    if (!selectedWidget?.bigqueryData) return null
    
    return {
      table: selectedWidget.bigqueryData.table || '',
      source: selectedWidget.bigqueryData.source || '',
      lastUpdated: selectedWidget.bigqueryData.lastUpdated || '',
      dataLength: Array.isArray(selectedWidget.bigqueryData.data) 
        ? selectedWidget.bigqueryData.data.length 
        : 0
    }
  }

  // Load tables on component mount
  useEffect(() => {
    loadAvailableTables()
  }, [])


  if (!selectedWidget || !isTableWidget(selectedWidget)) {
    return null
  }


  const handleRemoveColumn = (columnId: string) => {
    console.log('🗑️ handleRemoveColumn called:', { columnId, currentColumns: tableConfig.columns })
    const currentColumns = tableConfig.columns || []
    const updatedColumns = currentColumns.filter(col => col.id !== columnId)
    console.log('🗑️ handleRemoveColumn after filter:', { updatedColumns })
    onTableConfigChange('columns', updatedColumns)
  }


  return (
    <DndContext onDragEnd={handleDragEnd}>
      <div className="border-t pt-4 mt-4">
        <h4 className="text-sm font-medium text-gray-700 mb-4">📋 Table Configuration</h4>
      
      <Accordion type="multiple" className="w-full space-y-2">
        {/* Data & Columns */}
        <AccordionItem value="data">
          <AccordionTrigger className="text-sm font-medium text-gray-700">
            📊 Data & Columns
          </AccordionTrigger>
          <AccordionContent>
            <div className="grid grid-cols-2 gap-4">
              {/* Available Tables - Real BigQuery Data */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-2">
                  <Database className="inline w-3 h-3 mr-1" />
                  Available Tables
                </label>
                <div className="max-h-64 border border-gray-200 rounded bg-white">
                  <TablesExplorer 
                    compact={true}
                    showMetadata={false}
                    showMeasures={false}
                    showHeader={false}
                    className="max-h-64"
                  />
                </div>
              </div>

              {/* Selected Columns Drop Zone */}
              <div>
                <DropZone
                  id="selected-columns-drop-zone"
                  label="Selected Columns"
                  description="Drag columns here to add to your table"
                  icon={<Grab className="w-4 h-4" />}
                  fields={[]}
                  className="h-64"
                />
              </div>
            </div>

            {/* SQL Query Button */}
            {getSavedQuery() && (
              <div className="mt-4">
                <Button
                  onClick={() => {
                    setCurrentQuery(getSavedQuery())
                    setShowSqlModal(true)
                  }}
                  variant="outline"
                  size="sm"
                  className="w-full text-xs"
                >
                  <Eye className="w-3 h-3 mr-2" />
                  View SQL Query
                </Button>
              </div>
            )}
            
            <div className="mt-4">
              {/* Current Columns */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-2">
                  📋 Current Columns ({(tableConfig.columns || []).length})
                </label>
                <div className="space-y-2 max-h-32 overflow-y-auto border border-gray-200 rounded p-2 bg-white">
                  {(tableConfig.columns || []).map((column, index) => (
                    <div key={column.id} className="flex items-center gap-3 p-2 bg-gray-50 rounded border border-gray-100 hover:bg-gray-100 transition-colors">
                      <div className="text-xs text-gray-400 font-mono w-6">
                        {index + 1}.
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900 truncate">{column.header}</div>
                        <div className="text-xs text-gray-500 flex items-center gap-2">
                          <span className="font-mono bg-gray-200 px-1 rounded">{column.accessorKey}</span>
                          <span className="inline-flex items-center gap-1">
                            {column.type === 'text' && '📝'}
                            {column.type === 'number' && '🔢'}
                            {column.type === 'boolean' && '✅'}
                            {column.type === 'date' && '📅'}
                            {column.type}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemoveColumn(column.id)}
                        className="w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center text-xs transition-colors"
                        title="Remove column"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  {(!tableConfig.columns || tableConfig.columns.length === 0) && (
                    <div className="text-xs text-gray-400 italic p-4 text-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                      📋 No columns configured. Drag columns from available tables to add them.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Visual & Styling */}
        <AccordionItem value="visual">
          <AccordionTrigger className="text-sm font-medium text-gray-700">
            🎨 Visual & Styling
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-2">🎯 Header Background</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={tableConfig.headerBackground || '#f9fafb'}
                      onChange={(e) => onTableConfigChange('headerBackground', e.target.value)}
                      className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                    />
                    <div className="flex-1 px-2 py-1 bg-gray-50 border border-gray-200 rounded text-xs text-gray-600">
                      {tableConfig.headerBackground || '#f9fafb'}
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-2">✏️ Header Text Color</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={tableConfig.headerTextColor || '#374151'}
                      onChange={(e) => onTableConfigChange('headerTextColor', e.target.value)}
                      className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                    />
                    <div className="flex-1 px-2 py-1 bg-gray-50 border border-gray-200 rounded text-xs text-gray-600">
                      {tableConfig.headerTextColor || '#374151'}
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-2">🖱️ Row Hover Color</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={tableConfig.rowHoverColor || '#f3f4f6'}
                      onChange={(e) => onTableConfigChange('rowHoverColor', e.target.value)}
                      className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                    />
                    <div className="flex-1 px-2 py-1 bg-gray-50 border border-gray-200 rounded text-xs text-gray-600">
                      {tableConfig.rowHoverColor || '#f3f4f6'}
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-2">🔲 Border Color</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={tableConfig.borderColor || '#e5e7eb'}
                      onChange={(e) => onTableConfigChange('borderColor', e.target.value)}
                      className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                    />
                    <div className="flex-1 px-2 py-1 bg-gray-50 border border-gray-200 rounded text-xs text-gray-600">
                      {tableConfig.borderColor || '#e5e7eb'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Typography & Layout */}
        <AccordionItem value="typography">
          <AccordionTrigger className="text-sm font-medium text-gray-700">
            🖋️ Typography & Layout
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-6">
              {/* Header Typography */}
              <div className="border border-blue-200 rounded-lg p-4 bg-blue-50">
                <h6 className="text-sm font-medium text-blue-800 mb-3 flex items-center gap-2">
                  🎯 Header Typography
                </h6>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-blue-600 mb-1">Font Size</label>
                      <input
                        type="range"
                        min="10"
                        max="20"
                        step="1"
                        value={tableConfig.headerFontSize || 14}
                        onChange={(e) => onTableConfigChange('headerFontSize', parseInt(e.target.value))}
                        className="w-full"
                      />
                      <span className="text-xs text-blue-500">{tableConfig.headerFontSize || 14}px</span>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-blue-600 mb-1">Font Weight</label>
                      <select
                        value={tableConfig.headerFontWeight || 'normal'}
                        onChange={(e) => onTableConfigChange('headerFontWeight', e.target.value)}
                        className="w-full px-2 py-1 border border-blue-300 rounded text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                      >
                        <option value="normal">Normal</option>
                        <option value="500">Medium</option>
                        <option value="600">Semibold</option>
                        <option value="700">Bold</option>
                        <option value="800">Extra Bold</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-blue-600 mb-1">Font Family</label>
                    <select
                      value={tableConfig.headerFontFamily || 'inherit'}
                      onChange={(e) => onTableConfigChange('headerFontFamily', e.target.value)}
                      className="w-full px-2 py-1 border border-blue-300 rounded text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    >
                      <option value="inherit">Inherit (Default)</option>
                      <option value="Arial, sans-serif">Arial</option>
                      <option value="Helvetica, sans-serif">Helvetica</option>
                      <option value="'Times New Roman', serif">Times New Roman</option>
                      <option value="Georgia, serif">Georgia</option>
                      <option value="'Courier New', monospace">Courier New</option>
                      <option value="Verdana, sans-serif">Verdana</option>
                      <option value="'Trebuchet MS', sans-serif">Trebuchet MS</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Cell Typography */}
              <div className="border border-green-200 rounded-lg p-4 bg-green-50">
                <h6 className="text-sm font-medium text-green-800 mb-3 flex items-center gap-2">
                  📝 Cell Typography
                </h6>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-green-600 mb-1">Font Size</label>
                      <input
                        type="range"
                        min="10"
                        max="18"
                        step="1"
                        value={tableConfig.cellFontSize || tableConfig.fontSize || 14}
                        onChange={(e) => onTableConfigChange('cellFontSize', parseInt(e.target.value))}
                        className="w-full"
                      />
                      <span className="text-xs text-green-500">{tableConfig.cellFontSize || tableConfig.fontSize || 14}px</span>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-green-600 mb-1">Font Weight</label>
                      <select
                        value={tableConfig.cellFontWeight || 'normal'}
                        onChange={(e) => onTableConfigChange('cellFontWeight', e.target.value)}
                        className="w-full px-2 py-1 border border-green-300 rounded text-xs focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
                      >
                        <option value="normal">Normal</option>
                        <option value="500">Medium</option>
                        <option value="600">Semibold</option>
                        <option value="700">Bold</option>
                        <option value="800">Extra Bold</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-green-600 mb-1">Font Family</label>
                      <select
                        value={tableConfig.cellFontFamily || 'inherit'}
                        onChange={(e) => onTableConfigChange('cellFontFamily', e.target.value)}
                        className="w-full px-2 py-1 border border-green-300 rounded text-xs focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
                      >
                        <option value="inherit">Inherit (Default)</option>
                        <option value="Arial, sans-serif">Arial</option>
                        <option value="Helvetica, sans-serif">Helvetica</option>
                        <option value="'Times New Roman', serif">Times New Roman</option>
                        <option value="Georgia, serif">Georgia</option>
                        <option value="'Courier New', monospace">Courier New</option>
                        <option value="Verdana, sans-serif">Verdana</option>
                        <option value="'Trebuchet MS', sans-serif">Trebuchet MS</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-green-600 mb-2">Text Color</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={tableConfig.cellTextColor || '#1f2937'}
                          onChange={(e) => onTableConfigChange('cellTextColor', e.target.value)}
                          className="w-12 h-8 border border-green-300 rounded cursor-pointer"
                        />
                        <div className="flex-1 px-2 py-1 bg-white border border-green-200 rounded text-xs text-green-600">
                          {tableConfig.cellTextColor || '#1f2937'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Spacing */}
              <div className="border border-gray-200 rounded-lg p-3">
                <h6 className="text-sm font-medium text-gray-700 mb-3">📏 Spacing</h6>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Cell Padding</label>
                  <input
                    type="range"
                    min="4"
                    max="24"
                    step="2"
                    value={tableConfig.padding || 12}
                    onChange={(e) => onTableConfigChange('padding', parseInt(e.target.value))}
                    className="w-full"
                  />
                  <span className="text-xs text-gray-500">{tableConfig.padding || 12}px</span>
                </div>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Search & Filtering */}
        <AccordionItem value="search">
          <AccordionTrigger className="text-sm font-medium text-gray-700">
            🔍 Search & Filtering
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Search Placeholder</label>
                <input
                  type="text"
                  value={tableConfig.searchPlaceholder || 'Search...'}
                  onChange={(e) => onTableConfigChange('searchPlaceholder', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter search placeholder text"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <label className="flex items-center gap-2 text-xs">
                  <input
                    type="checkbox"
                    checked={tableConfig.enableSearch !== false}
                    onChange={(e) => onTableConfigChange('enableSearch', e.target.checked)}
                    className="rounded"
                  />
                  Enable Search
                </label>
                <label className="flex items-center gap-2 text-xs">
                  <input
                    type="checkbox"
                    checked={tableConfig.enableFiltering !== false}
                    onChange={(e) => onTableConfigChange('enableFiltering', e.target.checked)}
                    className="rounded"
                  />
                  Enable Filtering
                </label>
              </div>
              <div className="border border-blue-200 rounded-lg p-3 bg-blue-50">
                <h6 className="text-xs font-medium text-blue-800 mb-3 flex items-center gap-1">
                  ↕️ Default Sorting
                </h6>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-blue-600 mb-1">Sort Column</label>
                    <input
                      type="text"
                      value={tableConfig.defaultSortColumn || ''}
                      onChange={(e) => onTableConfigChange('defaultSortColumn', e.target.value)}
                      className="w-full px-2 py-2 border border-blue-300 rounded text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                      placeholder="e.g. name, id, created"
                    />
                    <div className="text-xs text-blue-500 mt-1">Column ID to sort by</div>
                  </div>
                  <div>
                    <label className="block text-xs text-blue-600 mb-1">Sort Direction</label>
                    <select
                      value={tableConfig.defaultSortDirection || 'asc'}
                      onChange={(e) => onTableConfigChange('defaultSortDirection', e.target.value)}
                      className="w-full px-2 py-2 border border-blue-300 rounded text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                    >
                      <option value="asc">⬆️ Ascending</option>
                      <option value="desc">⬇️ Descending</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Pagination & Navigation */}
        <AccordionItem value="pagination">
          <AccordionTrigger className="text-sm font-medium text-gray-700">
            📄 Pagination & Navigation
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Page Size</label>
                  <select
                    value={tableConfig.pageSize || 10}
                    onChange={(e) => onTableConfigChange('pageSize', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value={5}>5 rows</option>
                    <option value={10}>10 rows</option>
                    <option value={25}>25 rows</option>
                    <option value={50}>50 rows</option>
                    <option value={100}>100 rows</option>
                  </select>
                </div>
                <div className="flex items-center">
                  <label className="flex items-center gap-2 text-xs font-medium text-gray-600">
                    <input
                      type="checkbox"
                      checked={tableConfig.showPagination !== false}
                      onChange={(e) => onTableConfigChange('showPagination', e.target.checked)}
                      className="rounded"
                    />
                    Show Pagination
                  </label>
                </div>
              </div>
              <div className="flex items-center">
                <label className="flex items-center gap-2 text-xs font-medium text-gray-600">
                  <input
                    type="checkbox"
                    checked={tableConfig.showColumnToggle !== false}
                    onChange={(e) => onTableConfigChange('showColumnToggle', e.target.checked)}
                    className="rounded"
                  />
                  Show Column Toggle
                </label>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Row Selection & Behavior */}
        <AccordionItem value="behavior">
          <AccordionTrigger className="text-sm font-medium text-gray-700">
            ⚙️ Row Selection & Behavior
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <label className="flex items-center gap-2 text-xs">
                  <input
                    type="checkbox"
                    checked={tableConfig.enableRowSelection !== false}
                    onChange={(e) => onTableConfigChange('enableRowSelection', e.target.checked)}
                    className="rounded"
                  />
                  Enable Row Selection
                </label>
                {tableConfig.enableRowSelection !== false && (
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Selection Mode</label>
                    <select
                      value={tableConfig.selectionMode || 'single'}
                      onChange={(e) => onTableConfigChange('selectionMode', e.target.value)}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="single">Single</option>
                      <option value="multiple">Multiple</option>
                    </select>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <label className="flex items-center gap-2 text-xs">
                  <input
                    type="checkbox"
                    checked={tableConfig.enableSimulation !== false}
                    onChange={(e) => onTableConfigChange('enableSimulation', e.target.checked)}
                    className="rounded"
                  />
                  Enable Live Simulation
                </label>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Data Source</label>
                  <input
                    type="text"
                    value={tableConfig.dataSource || ''}
                    onChange={(e) => onTableConfigChange('dataSource', e.target.value)}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="API endpoint or data source"
                  />
                </div>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Export & Advanced */}
        <AccordionItem value="export">
          <AccordionTrigger className="text-sm font-medium text-gray-700">
            📤 Export & Advanced
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4">
              <label className="flex items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  checked={tableConfig.enableExport !== false}
                  onChange={(e) => onTableConfigChange('enableExport', e.target.checked)}
                  className="rounded"
                />
                Enable Export
              </label>
              {tableConfig.enableExport !== false && (
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-2">Export Formats</label>
                  <div className="flex gap-2">
                    {['csv', 'excel', 'pdf'].map((format) => (
                      <label key={format} className="flex items-center gap-1 text-xs">
                        <input
                          type="checkbox"
                          checked={(tableConfig.exportFormats || []).includes(format as 'csv' | 'excel' | 'pdf')}
                          onChange={(e) => {
                            const current = tableConfig.exportFormats || []
                            const updated = e.target.checked
                              ? [...current, format]
                              : current.filter(f => f !== format)
                            onTableConfigChange('exportFormats', updated)
                          }}
                          className="rounded"
                        />
                        {format.toUpperCase()}
                      </label>
                    ))}
                  </div>
                </div>
              )}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Refresh Rate</label>
                <input
                  type="text"
                  value={tableConfig.refreshRate || ''}
                  onChange={(e) => onTableConfigChange('refreshRate', e.target.value)}
                  className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="e.g. 30s, 1m, 5m"
                />
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
      </div>
      
      {/* SQL Query Modal */}
      {showSqlModal && currentQuery && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100]">
          <Card className="w-[90vw] max-w-3xl max-h-[70vh] relative z-[101] overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Eye className="w-5 h-5 text-primary" />
                  SQL Query
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowSqlModal(false)}
                  className="h-8 w-8 p-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              {(() => {
                const tableInfo = getSavedTableInfo()
                return tableInfo ? (
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p><strong>Source:</strong> {tableInfo.source} | <strong>Table:</strong> {tableInfo.table}</p>
                    <p><strong>Data Rows:</strong> {tableInfo.dataLength} | <strong>Columns:</strong> {(tableConfig.columns || []).length}</p>
                    {tableInfo.lastUpdated && (
                      <p><strong>Last Updated:</strong> {new Date(tableInfo.lastUpdated).toLocaleString()}</p>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Columns: {(tableConfig.columns || []).length}
                  </p>
                )
              })()}
            </CardHeader>
            <CardContent className="overflow-hidden">
              <ScrollArea className="h-80">
                <pre className="text-xs bg-gray-50 p-4 rounded border font-mono whitespace-pre-wrap">
                  {currentQuery}
                </pre>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      )}
      
      {/* Preview Modal */}
      {showPreviewModal && previewTableId && previewData[previewTableId] && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100]">
          <Card className="w-[90vw] max-w-4xl max-h-[80vh] relative z-[101] overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Eye className="w-5 h-5 text-primary" />
                  Preview: {previewTableId}
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowPreviewModal(false)}
                  className="h-8 w-8 p-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Showing first {previewData[previewTableId]?.length || 0} rows
                </p>
                <Button
                  onClick={() => handleUseTableData(previewTableId)}
                  className="text-sm h-8"
                >
                  Use This Table
                </Button>
              </div>
            </CardHeader>
            <CardContent className="overflow-hidden">
              <ScrollArea className="h-96">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="border-b">
                        {previewData[previewTableId] && previewData[previewTableId].length > 0 && 
                          Object.keys(previewData[previewTableId][0]).map((column) => (
                            <th
                              key={column}
                              className="text-left py-2 px-3 bg-muted/50 font-medium text-xs"
                            >
                              {column}
                            </th>
                          ))
                        }
                      </tr>
                    </thead>
                    <tbody>
                      {previewData[previewTableId]?.map((row, index) => (
                        <tr key={index} className="border-b hover:bg-muted/30">
                          {Object.values(row).map((value, colIndex) => (
                            <td key={colIndex} className="py-2 px-3 text-xs">
                              {value === null || value === undefined 
                                ? <span className="text-muted-foreground italic">null</span>
                                : String(value)
                              }
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      )}
    </DndContext>
  )
}