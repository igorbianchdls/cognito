'use client'

import type { DroppedWidget } from '@/types/apps/droppedWidget'
import { isTableWidget } from '@/types/apps/tableWidgets'
import type { TableConfig } from '@/types/apps/tableWidgets'

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
  
  if (!selectedWidget || !isTableWidget(selectedWidget)) {
    return null
  }

  return (
    <div className="border-t pt-4 mt-4">
      <h4 className="text-sm font-medium text-gray-700 mb-4">📋 Table Configuration</h4>
      
      <div className="space-y-6">
        {/* Data & Columns */}
        <div>
          <h5 className="text-sm font-medium text-gray-700 mb-3">📊 Data & Columns</h5>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Data Source</label>
              <input
                type="text"
                value={tableConfig.dataSource || ''}
                onChange={(e) => {
                  console.log('🎨 TableConfigEditor: Data source changed to:', e.target.value)
                  onTableConfigChange('dataSource', e.target.value)
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="BigQuery, API, etc."
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Page Size</label>
                <select
                  value={tableConfig.pageSize || 10}
                  onChange={(e) => {
                    console.log('🎨 TableConfigEditor: Page size changed to:', e.target.value)
                    onTableConfigChange('pageSize', parseInt(e.target.value))
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value={5}>5 rows</option>
                  <option value={10}>10 rows</option>
                  <option value={25}>25 rows</option>
                  <option value={50}>50 rows</option>
                  <option value={100}>100 rows</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Search Placeholder</label>
                <input
                  type="text"
                  value={tableConfig.searchPlaceholder || 'Search...'}
                  onChange={(e) => {
                    console.log('🎨 TableConfigEditor: Search placeholder changed to:', e.target.value)
                    onTableConfigChange('searchPlaceholder', e.target.value)
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Search..."
                />
              </div>
            </div>
          </div>
        </div>

        {/* Colors & Styling */}
        <div>
          <h5 className="text-lg font-bold text-gray-700 mb-3 mt-2">🎨 Colors & Styling</h5>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Header Background</label>
                <input
                  type="color"
                  value={tableConfig.headerBackground || '#f9fafb'}
                  onChange={(e) => {
                    console.log('🎨 TableConfigEditor: Header background changed to:', e.target.value)
                    onTableConfigChange('headerBackground', e.target.value)
                  }}
                  className="w-full h-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Header Text Color</label>
                <input
                  type="color"
                  value={tableConfig.headerTextColor || '#374151'}
                  onChange={(e) => {
                    console.log('🎨 TableConfigEditor: Header text color changed to:', e.target.value)
                    onTableConfigChange('headerTextColor', e.target.value)
                  }}
                  className="w-full h-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Row Hover Color</label>
                <input
                  type="color"
                  value={tableConfig.rowHoverColor || '#f3f4f6'}
                  onChange={(e) => {
                    console.log('🎨 TableConfigEditor: Row hover color changed to:', e.target.value)
                    onTableConfigChange('rowHoverColor', e.target.value)
                  }}
                  className="w-full h-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Border Color</label>
                <input
                  type="color"
                  value={tableConfig.borderColor || '#e5e7eb'}
                  onChange={(e) => {
                    console.log('🎨 TableConfigEditor: Border color changed to:', e.target.value)
                    onTableConfigChange('borderColor', e.target.value)
                  }}
                  className="w-full h-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Refresh Rate</label>
                <input
                  type="text"
                  value={tableConfig.refreshRate || ''}
                  onChange={(e) => {
                    console.log('🎨 TableConfigEditor: Refresh rate changed to:', e.target.value)
                    onTableConfigChange('refreshRate', e.target.value)
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g. 30s, 1m, 5m"
                />
              </div>
              <div>
                <label className="flex items-center gap-2 text-xs font-medium text-gray-600">
                  <input
                    type="checkbox"
                    checked={tableConfig.enableSimulation !== false}
                    onChange={(e) => {
                      console.log('🎨 TableConfigEditor: Enable simulation changed to:', e.target.checked)
                      onTableConfigChange('enableSimulation', e.target.checked)
                    }}
                    className="rounded"
                  />
                  Enable Simulation
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Typography */}
        <div>
          <h5 className="text-sm font-medium text-gray-700 mb-3">✍️ Typography</h5>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-2">Header Typography</label>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Font Size</label>
                  <input
                    type="range"
                    min="10"
                    max="20"
                    step="1"
                    value={tableConfig.headerFontSize || 14}
                    onChange={(e) => {
                      console.log('🎨 TableConfigEditor: Header font size changed to:', e.target.value)
                      onTableConfigChange('headerFontSize', parseInt(e.target.value))
                    }}
                    className="w-full"
                  />
                  <span className="text-xs text-gray-500">{tableConfig.headerFontSize || 14}px</span>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Weight</label>
                  <select
                    value={tableConfig.headerFontWeight || 'normal'}
                    onChange={(e) => {
                      console.log('🎨 TableConfigEditor: Header font weight changed to:', e.target.value)
                      onTableConfigChange('headerFontWeight', e.target.value)
                    }}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                  >
                    <option value="normal">Normal</option>
                    <option value="500">Medium</option>
                    <option value="600">Semi Bold</option>
                    <option value="700">Bold</option>
                    <option value="800">Extra Bold</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Family</label>
                  <select
                    value={tableConfig.headerFontFamily || 'inherit'}
                    onChange={(e) => {
                      console.log('🎨 TableConfigEditor: Header font family changed to:', e.target.value)
                      onTableConfigChange('headerFontFamily', e.target.value)
                    }}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                  >
                    <option value="inherit">Default</option>
                    <option value="Arial, sans-serif">Arial</option>
                    <option value="Helvetica, sans-serif">Helvetica</option>
                    <option value="Georgia, serif">Georgia</option>
                  </select>
                </div>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-2">Cell Typography</label>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Font Size</label>
                  <input
                    type="range"
                    min="10"
                    max="18"
                    step="1"
                    value={tableConfig.cellFontSize || tableConfig.fontSize || 14}
                    onChange={(e) => {
                      console.log('🎨 TableConfigEditor: Cell font size changed to:', e.target.value)
                      onTableConfigChange('cellFontSize', parseInt(e.target.value))
                    }}
                    className="w-full"
                  />
                  <span className="text-xs text-gray-500">{tableConfig.cellFontSize || tableConfig.fontSize || 14}px</span>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Color</label>
                  <input
                    type="color"
                    value={tableConfig.cellTextColor || '#1f2937'}
                    onChange={(e) => {
                      console.log('🎨 TableConfigEditor: Cell text color changed to:', e.target.value)
                      onTableConfigChange('cellTextColor', e.target.value)
                    }}
                    className="w-full h-8 border border-gray-300 rounded"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Weight</label>
                  <select
                    value={tableConfig.cellFontWeight || 'normal'}
                    onChange={(e) => {
                      console.log('🎨 TableConfigEditor: Cell font weight changed to:', e.target.value)
                      onTableConfigChange('cellFontWeight', e.target.value)
                    }}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                  >
                    <option value="normal">Normal</option>
                    <option value="500">Medium</option>
                    <option value="600">Semi Bold</option>
                    <option value="700">Bold</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Layout & Options */}
        <div>
          <h5 className="text-sm font-medium text-gray-700 mb-3">📐 Layout & Options</h5>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Cell Padding</label>
              <input
                type="range"
                min="4"
                max="24"
                step="2"
                value={tableConfig.padding || 12}
                onChange={(e) => {
                  console.log('🎨 TableConfigEditor: Padding changed to:', e.target.value)
                  onTableConfigChange('padding', parseInt(e.target.value))
                }}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>4px</span>
                <span className="font-medium">{tableConfig.padding || 12}px</span>
                <span>24px</span>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-3">
                <label className="flex items-center gap-2 text-xs">
                  <input
                    type="checkbox"
                    checked={tableConfig.showPagination !== false}
                    onChange={(e) => {
                      console.log('🎨 TableConfigEditor: Show pagination changed to:', e.target.checked)
                      onTableConfigChange('showPagination', e.target.checked)
                    }}
                    className="rounded"
                  />
                  <span className="font-medium text-gray-600">Show Pagination</span>
                </label>
                <label className="flex items-center gap-2 text-xs">
                  <input
                    type="checkbox"
                    checked={tableConfig.enableSearch !== false}
                    onChange={(e) => {
                      console.log('🎨 TableConfigEditor: Enable search changed to:', e.target.checked)
                      onTableConfigChange('enableSearch', e.target.checked)
                    }}
                    className="rounded"
                  />
                  <span className="font-medium text-gray-600">Enable Search</span>
                </label>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <label className="flex items-center gap-2 text-xs">
                  <input
                    type="checkbox"
                    checked={tableConfig.showColumnToggle !== false}
                    onChange={(e) => {
                      console.log('🎨 TableConfigEditor: Show column toggle changed to:', e.target.checked)
                      onTableConfigChange('showColumnToggle', e.target.checked)
                    }}
                    className="rounded"
                  />
                  <span className="font-medium text-gray-600">Column Toggle</span>
                </label>
                <label className="flex items-center gap-2 text-xs">
                  <input
                    type="checkbox"
                    checked={tableConfig.enableFiltering !== false}
                    onChange={(e) => {
                      console.log('🎨 TableConfigEditor: Enable filtering changed to:', e.target.checked)
                      onTableConfigChange('enableFiltering', e.target.checked)
                    }}
                    className="rounded"
                  />
                  <span className="font-medium text-gray-600">Enable Filtering</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Export & Advanced Options */}
        <div>
          <h5 className="text-sm font-medium text-gray-700 mb-3">📤 Export & Advanced</h5>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <label className="flex items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  checked={tableConfig.enableExport !== false}
                  onChange={(e) => {
                    console.log('🎨 TableConfigEditor: Enable export changed to:', e.target.checked)
                    onTableConfigChange('enableExport', e.target.checked)
                  }}
                  className="rounded"
                />
                <span className="font-medium text-gray-600">Enable Export</span>
              </label>
              <label className="flex items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  checked={tableConfig.enableRowSelection !== false}
                  onChange={(e) => {
                    console.log('🎨 TableConfigEditor: Enable row selection changed to:', e.target.checked)
                    onTableConfigChange('enableRowSelection', e.target.checked)
                  }}
                  className="rounded"
                />
                <span className="font-medium text-gray-600">Row Selection</span>
              </label>
            </div>
            
            {tableConfig.enableRowSelection && (
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Selection Mode</label>
                <select
                  value={tableConfig.selectionMode || 'single'}
                  onChange={(e) => {
                    console.log('🎨 TableConfigEditor: Selection mode changed to:', e.target.value)
                    onTableConfigChange('selectionMode', e.target.value)
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="single">Single Selection</option>
                  <option value="multiple">Multiple Selection</option>
                </select>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}