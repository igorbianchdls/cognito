'use client'

import type { DroppedWidget } from '@/types/apps/widget'
import { isTableWidget } from '@/types/apps/tableWidgets'
import type { TableConfig } from '@/types/apps/tableWidgets'
import { useState } from 'react'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'

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
  
  const [newColumn, setNewColumn] = useState<{
    id: string
    header: string
    accessorKey: string
    type: 'text' | 'number' | 'boolean' | 'date'
    width: number
    sortable: boolean
  }>({
    id: '',
    header: '',
    accessorKey: '',
    type: 'text',
    width: 150,
    sortable: true
  })

  if (!selectedWidget || !isTableWidget(selectedWidget)) {
    return null
  }

  // Helper functions
  const handleAddColumn = () => {
    if (!newColumn.id || !newColumn.header || !newColumn.accessorKey) return
    
    const currentColumns = tableConfig.columns || []
    const updatedColumns = [...currentColumns, { ...newColumn }]
    
    onTableConfigChange('columns', updatedColumns)
    setNewColumn({
      id: '',
      header: '',
      accessorKey: '',
      type: 'text' as const,
      width: 150,
      sortable: true
    })
  }

  const handleRemoveColumn = (columnId: string) => {
    const currentColumns = tableConfig.columns || []
    const updatedColumns = currentColumns.filter(col => col.id !== columnId)
    onTableConfigChange('columns', updatedColumns)
  }


  return (
    <div className="border-t pt-4 mt-4">
      <h4 className="text-sm font-medium text-gray-700 mb-4">📋 Table Configuration</h4>
      
      <Accordion type="multiple" className="w-full space-y-2">
        {/* Data & Columns */}
        <AccordionItem value="data">
          <AccordionTrigger className="text-sm font-medium text-gray-700">
            📊 Data & Columns
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4">
              {/* Existing Columns */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-2">
                  📋 Current Columns ({(tableConfig.columns || []).length})
                </label>
                <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-200 rounded p-2 bg-white">
                  {(tableConfig.columns || []).map((column, index) => (
                    <div key={column.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100 hover:bg-gray-100 transition-colors">
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
                          <span>{column.width}px</span>
                          {column.sortable && <span>↕️</span>}
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemoveColumn(column.id)}
                        className="w-7 h-7 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center text-sm transition-colors"
                        title="Remove column"
                      >
                        🗑️
                      </button>
                    </div>
                  ))}
                  {(!tableConfig.columns || tableConfig.columns.length === 0) && (
                    <div className="text-xs text-gray-400 italic p-4 text-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                      📋 No columns configured. Using default sample columns.
                    </div>
                  )}
                </div>
              </div>

              {/* Add New Column */}
              <div className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                <h6 className="text-xs font-medium text-gray-600 mb-3">➕ Add New Column</h6>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Column ID *</label>
                      <input
                        type="text"
                        placeholder="unique_id"
                        value={newColumn.id}
                        onChange={(e) => setNewColumn(prev => ({ ...prev, id: e.target.value }))}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Header Text *</label>
                      <input
                        type="text"
                        placeholder="Display Name"
                        value={newColumn.header}
                        onChange={(e) => setNewColumn(prev => ({ ...prev, header: e.target.value }))}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Data Key *</label>
                      <input
                        type="text"
                        placeholder="field_name"
                        value={newColumn.accessorKey}
                        onChange={(e) => setNewColumn(prev => ({ ...prev, accessorKey: e.target.value }))}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Data Type</label>
                      <select
                        value={newColumn.type}
                        onChange={(e) => setNewColumn(prev => ({ ...prev, type: e.target.value as 'text' | 'number' | 'boolean' | 'date' }))}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="text">📝 Text</option>
                        <option value="number">🔢 Number</option>
                        <option value="boolean">✅ Boolean</option>
                        <option value="date">📅 Date</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex gap-3 items-end">
                    <div className="flex-1">
                      <label className="block text-xs text-gray-500 mb-1">Width (px)</label>
                      <input
                        type="number"
                        min="50"
                        max="500"
                        placeholder="150"
                        value={newColumn.width}
                        onChange={(e) => setNewColumn(prev => ({ ...prev, width: parseInt(e.target.value) || 150 }))}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <label className="flex items-center gap-2 text-xs text-gray-600 pb-1">
                      <input
                        type="checkbox"
                        checked={newColumn.sortable}
                        onChange={(e) => setNewColumn(prev => ({ ...prev, sortable: e.target.checked }))}
                        className="rounded"
                      />
                      ↕️ Sortable
                    </label>
                  </div>
                  <button
                    onClick={handleAddColumn}
                    disabled={!newColumn.id || !newColumn.header || !newColumn.accessorKey}
                    className="w-full px-3 py-2 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
                  >
                    ➕ Add Column
                  </button>
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

        {/* Layout & Spacing */}
        <AccordionItem value="layout">
          <AccordionTrigger className="text-sm font-medium text-gray-700">
            📏 Layout & Spacing
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Font Size</label>
                  <input
                    type="range"
                    min="10"
                    max="18"
                    step="1"
                    value={tableConfig.fontSize || 14}
                    onChange={(e) => onTableConfigChange('fontSize', parseInt(e.target.value))}
                    className="w-full"
                  />
                  <span className="text-xs text-gray-500">{tableConfig.fontSize || 14}px</span>
                </div>
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
  )
}