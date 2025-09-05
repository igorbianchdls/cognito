'use client'

import type { DroppedWidget } from '@/types/apps/droppedWidget'
import { isTableWidget } from '@/types/apps/tableWidgets'
import type { TableConfig } from '@/types/apps/tableWidgets'
import { Slider } from '@/components/ui/slider'

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
              <label className="block text-xs font-medium text-gray-600 mb-1">Table Name</label>
              <input
                type="text"
                value={tableConfig.tableName || ''}
                onChange={(e) => {
                  console.log('🎨 TableConfigEditor: Table name changed to:', e.target.value)
                  onTableConfigChange('tableName', e.target.value)
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="My Data Table"
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
                <label className="block text-xs font-medium text-gray-600 mb-1">Border Width</label>
                <input
                  type="number"
                  min="0"
                  max="5"
                  value={tableConfig.borderWidth || 1}
                  onChange={(e) => {
                    console.log('🎨 TableConfigEditor: Border width changed to:', e.target.value)
                    onTableConfigChange('borderWidth', parseInt(e.target.value) || 0)
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Border Radius</label>
                <input
                  type="number"
                  min="0"
                  max="20"
                  value={tableConfig.borderRadius || 8}
                  onChange={(e) => {
                    console.log('🎨 TableConfigEditor: Border radius changed to:', e.target.value)
                    onTableConfigChange('borderRadius', parseInt(e.target.value) || 0)
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex items-center">
              <label className="flex items-center gap-2 text-xs font-medium text-gray-600">
                <input
                  type="checkbox"
                  checked={tableConfig.showStripes !== false}
                  onChange={(e) => {
                    console.log('🎨 TableConfigEditor: Show stripes changed to:', e.target.checked)
                    onTableConfigChange('showStripes', e.target.checked)
                  }}
                  className="rounded"
                />
                Striped Rows
              </label>
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
                    value={tableConfig.headerFontWeight || 600}
                    onChange={(e) => {
                      console.log('🎨 TableConfigEditor: Header font weight changed to:', e.target.value)
                      onTableConfigChange('headerFontWeight', parseInt(e.target.value))
                    }}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                  >
                    <option value={400}>Normal</option>
                    <option value={500}>Medium</option>
                    <option value={600}>Semi Bold</option>
                    <option value={700}>Bold</option>
                    <option value={800}>Extra Bold</option>
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
                    value={tableConfig.cellFontWeight || 400}
                    onChange={(e) => {
                      console.log('🎨 TableConfigEditor: Cell font weight changed to:', e.target.value)
                      onTableConfigChange('cellFontWeight', parseInt(e.target.value))
                    }}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                  >
                    <option value={400}>Normal</option>
                    <option value={500}>Medium</option>
                    <option value={600}>Semi Bold</option>
                    <option value={700}>Bold</option>
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
                    checked={tableConfig.enableSorting !== false}
                    onChange={(e) => {
                      console.log('🎨 TableConfigEditor: Enable sorting changed to:', e.target.checked)
                      onTableConfigChange('enableSorting', e.target.checked)
                    }}
                    className="rounded"
                  />
                  <span className="font-medium text-gray-600">Enable Sorting</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Display Options */}
        <div>
          <h5 className="text-sm font-medium text-gray-700 mb-3">👁️ Display Options</h5>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-2">Table Style</label>
              <div className="flex gap-1">
                {[
                  { value: 'default', label: 'Default', icon: '📋' },
                  { value: 'minimal', label: 'Minimal', icon: '📄' },
                  { value: 'modern', label: 'Modern', icon: '✨' }
                ].map((style) => (
                  <button
                    key={style.value}
                    onClick={() => {
                      console.log('🎨 TableConfigEditor: Table style changed to:', style.value)
                      onTableConfigChange('tableStyle', style.value)
                    }}
                    className={`px-2 py-2 text-xs border rounded-md transition-colors ${
                      (tableConfig.tableStyle || 'default') === style.value
                        ? 'bg-blue-900 border-blue-300 text-blue-300'
                        : 'bg-[#333333] border-gray-700 text-[#888888] hover:bg-gray-700'
                    }`}
                  >
                    <span className="mr-1">{style.icon}</span>
                    {style.label}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="space-y-2">
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
          </div>
        </div>
      </div>
    </div>
  )
}