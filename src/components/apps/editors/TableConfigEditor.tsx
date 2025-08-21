'use client'

import type { DroppedWidget } from '@/types/widget'
import { isTableWidget } from '@/types/tableWidgets'
import type { TableConfig } from '@/types/tableWidgets'
import { useState } from 'react'

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
      
      <div className="space-y-6">
        {/* Data & Columns */}
        <div>
          <h5 className="text-lg font-bold text-gray-700 mb-3">📊 Data & Columns</h5>
          <div className="space-y-4">
            
            {/* Existing Columns */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-2">Current Columns</label>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {(tableConfig.columns || []).map((column) => (
                  <div key={column.id} className="flex items-center gap-2 p-2 bg-[#333333] rounded">
                    <div className="flex-1">
                      <div className="text-sm font-medium">{column.header}</div>
                      <div className="text-xs text-gray-500">
                        {column.accessorKey} • {column.type} • {column.width}px
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveColumn(column.id)}
                      className="w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center text-xs"
                      title="Remove column"
                    >
                      ×
                    </button>
                  </div>
                ))}
                {(!tableConfig.columns || tableConfig.columns.length === 0) && (
                  <div className="text-xs text-gray-400 italic p-2">No columns configured. Using default columns.</div>
                )}
              </div>
            </div>

            {/* Add New Column */}
            <div className="border border-gray-200 rounded-lg p-3">
              <h6 className="text-xs font-medium text-gray-600 mb-2">Add New Column</h6>
              <div className="grid grid-cols-2 gap-2 mb-2">
                <input
                  type="text"
                  placeholder="Column ID"
                  value={newColumn.id}
                  onChange={(e) => setNewColumn(prev => ({ ...prev, id: e.target.value }))}
                  className="px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <input
                  type="text"
                  placeholder="Header Text"
                  value={newColumn.header}
                  onChange={(e) => setNewColumn(prev => ({ ...prev, header: e.target.value }))}
                  className="px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <input
                  type="text"
                  placeholder="Data Key"
                  value={newColumn.accessorKey}
                  onChange={(e) => setNewColumn(prev => ({ ...prev, accessorKey: e.target.value }))}
                  className="px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <select
                  value={newColumn.type}
                  onChange={(e) => setNewColumn(prev => ({ ...prev, type: e.target.value as 'text' | 'number' | 'boolean' | 'date' }))}
                  className="px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="text">Text</option>
                  <option value="number">Number</option>
                  <option value="boolean">Boolean</option>
                  <option value="date">Date</option>
                </select>
              </div>
              <div className="flex gap-2 mb-2">
                <input
                  type="number"
                  placeholder="Width (px)"
                  value={newColumn.width}
                  onChange={(e) => setNewColumn(prev => ({ ...prev, width: parseInt(e.target.value) || 150 }))}
                  className="flex-1 px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <label className="flex items-center gap-1 text-xs">
                  <input
                    type="checkbox"
                    checked={newColumn.sortable}
                    onChange={(e) => setNewColumn(prev => ({ ...prev, sortable: e.target.checked }))}
                    className="rounded"
                  />
                  Sortable
                </label>
              </div>
              <button
                onClick={handleAddColumn}
                disabled={!newColumn.id || !newColumn.header || !newColumn.accessorKey}
                className="w-full px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed"
              >
                Add Column
              </button>
            </div>
          </div>
        </div>

        {/* Search & Filtering */}
        <div>
          <h5 className="text-lg font-bold text-gray-700 mb-3">🔍 Search & Filtering</h5>
          <div className="space-y-3">
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
          </div>
        </div>

        {/* Pagination */}
        <div>
          <h5 className="text-lg font-bold text-gray-700 mb-3">📄 Pagination</h5>
          <div className="space-y-3">
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
        </div>

        {/* Styling */}
        <div>
          <h5 className="text-lg font-bold text-gray-700 mb-3">🎨 Styling</h5>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Header Background</label>
                <input
                  type="color"
                  value={tableConfig.headerBackground || '#f9fafb'}
                  onChange={(e) => onTableConfigChange('headerBackground', e.target.value)}
                  className="w-full h-10 border border-gray-300 rounded cursor-pointer"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Header Text Color</label>
                <input
                  type="color"
                  value={tableConfig.headerTextColor || '#374151'}
                  onChange={(e) => onTableConfigChange('headerTextColor', e.target.value)}
                  className="w-full h-10 border border-gray-300 rounded cursor-pointer"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Row Hover Color</label>
                <input
                  type="color"
                  value={tableConfig.rowHoverColor || '#f3f4f6'}
                  onChange={(e) => onTableConfigChange('rowHoverColor', e.target.value)}
                  className="w-full h-10 border border-gray-300 rounded cursor-pointer"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Border Color</label>
                <input
                  type="color"
                  value={tableConfig.borderColor || '#e5e7eb'}
                  onChange={(e) => onTableConfigChange('borderColor', e.target.value)}
                  className="w-full h-10 border border-gray-300 rounded cursor-pointer"
                />
              </div>
            </div>
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
        </div>

        {/* Behavior */}
        <div>
          <h5 className="text-lg font-bold text-gray-700 mb-3">⚙️ Behavior</h5>
          <div className="space-y-3">
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
        </div>

        {/* Export Options */}
        <div>
          <h5 className="text-lg font-bold text-gray-700 mb-3">📤 Export Options</h5>
          <div className="space-y-3">
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
          </div>
        </div>
      </div>
    </div>
  )
}