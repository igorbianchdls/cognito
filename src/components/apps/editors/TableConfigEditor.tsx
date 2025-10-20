'use client'

import type { DroppedWidget } from '@/types/apps/droppedWidget'
import { isTableWidget } from '@/types/apps/tableWidgets'
import type { TableConfig } from '@/types/apps/tableWidgets'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import TableEditingAccordion from './TableEditingAccordion'
import TableAppearanceAccordion from './TableAppearanceAccordion'
import TableTypographyAccordion from './TableTypographyAccordion'
import TableHeaderAccordion from './TableHeaderAccordion'
import TableCellAccordion from './TableCellAccordion'
import TableBehaviorAccordion from './TableBehaviorAccordion'
import TableExportAccordion from './TableExportAccordion'
import TableColumnColorsAccordion from './TableColumnColorsAccordion'
import PositionAccordion from './PositionAccordion'
import TableStyleClipboardAccordion from './TableStyleClipboardAccordion'

interface TableConfigEditorProps {
  selectedWidget: DroppedWidget
  tableConfig: TableConfig
  onTableConfigChange: (field: string, value: unknown) => void
  onWidgetChange?: (field: string, value: unknown) => void
  onLayoutChange?: (layoutChanges: {x?: number, y?: number, w?: number, h?: number}) => void
}

export default function TableConfigEditor({ 
  selectedWidget, 
  tableConfig, 
  onTableConfigChange,
  onWidgetChange,
  onLayoutChange
}: TableConfigEditorProps) {
  
  if (!selectedWidget || !isTableWidget(selectedWidget)) {
    return null
  }

  // Generate columns array from data if it doesn't exist
  const columns = tableConfig.columns || (tableConfig.data && tableConfig.data.length > 0 
    ? Object.keys(tableConfig.data[0])
        .filter(key => key !== 'id')
        .map(key => ({
          id: key,
          header: key.charAt(0).toUpperCase() + key.slice(1),
          accessorKey: key,
          type: 'text' as const
        }))
    : [])

  // Handle column updates for colors
  const handleColumnUpdate = (columnId: string, updates: Partial<import('@/types/apps/tableWidgets').TableColumn>) => {
    const currentColumns = tableConfig.columns || columns
    const updatedColumns = currentColumns.map(col => 
      col.id === columnId ? { ...col, ...updates } : col
    )
    onTableConfigChange('columns', updatedColumns)
  }

  return (
    <div className="border-t pt-4 mt-4">
      <h4 className="text-sm font-medium text-gray-700 mb-4">📋 Table Configuration</h4>
      
        {/* Basic Configuration - Always Visible */}
        <div className="space-y-4">
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

          {/* Grid Position & Size */}
          {onWidgetChange && (
            <div>
              <h5 className="text-sm font-medium text-gray-700 mb-3">📐 Grid Position & Size</h5>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">X Position</label>
                    <input
                      type="number"
                      min="0"
                      value={selectedWidget.x ?? 0}
                      onChange={(e) => {
                        const value = parseInt(e.target.value) || 0
                        console.log('📋 TableEditor: X position changed to:', value)
                        onWidgetChange('x', value)
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Y Position</label>
                    <input
                      type="number"
                      min="0"
                      value={selectedWidget.y ?? 0}
                      onChange={(e) => {
                        const value = parseInt(e.target.value) || 0
                        console.log('📋 TableEditor: Y position changed to:', value)
                        onWidgetChange('y', value)
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Width (grid units)</label>
                    <input
                      type="number"
                      min="1"
                      max="12"
                      value={selectedWidget.w ?? 6}
                      onChange={(e) => {
                        const value = parseInt(e.target.value) || 1
                        console.log('📋 TableEditor: Width changed to:', value)
                        onWidgetChange('w', value)
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Height (grid units)</label>
                    <input
                      type="number"
                      min="1"
                      max="12"
                      value={selectedWidget.h ?? 4}
                      onChange={(e) => {
                        const value = parseInt(e.target.value) || 1
                        console.log('📋 TableEditor: Height changed to:', value)
                        onWidgetChange('h', value)
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Advanced Options - Accordions */}
        <div className="mt-6">
          <h6 className="text-sm font-medium text-gray-700 mb-3">⚙️ Advanced Options</h6>
          <Accordion type="multiple" className="w-full space-y-2">
            
            <TableEditingAccordion 
              styling={tableConfig} 
              onConfigChange={onTableConfigChange} 
            />
            
            <TableAppearanceAccordion 
              styling={tableConfig} 
              onConfigChange={onTableConfigChange} 
            />

            <TableTypographyAccordion
              styling={tableConfig}
              onConfigChange={onTableConfigChange}
            />

            <TableHeaderAccordion
              headerFontSize={tableConfig.headerFontSize}
              headerFontFamily={tableConfig.headerFontFamily}
              headerFontWeight={tableConfig.headerFontWeight}
              headerTextColor={tableConfig.headerTextColor}
              headerBackground={tableConfig.headerBackground}
              padding={tableConfig.padding}
              onConfigChange={onTableConfigChange}
            />

            <TableCellAccordion
              cellFontSize={tableConfig.cellFontSize}
              fontSize={tableConfig.fontSize}
              cellFontFamily={tableConfig.cellFontFamily}
              cellFontWeight={tableConfig.cellFontWeight}
              cellTextColor={tableConfig.cellTextColor}
              lineHeight={tableConfig.lineHeight}
              letterSpacing={tableConfig.letterSpacing}
              defaultTextAlign={tableConfig.defaultTextAlign}
              padding={tableConfig.padding}
              rowHoverColor={tableConfig.rowHoverColor}
              editingCellColor={tableConfig.editingCellColor}
              validationErrorColor={tableConfig.validationErrorColor}
              modifiedCellColor={tableConfig.modifiedCellColor}
              newRowColor={tableConfig.newRowColor}
              borderColor={tableConfig.borderColor}
              onConfigChange={onTableConfigChange}
            />

            <TableBehaviorAccordion
              styling={tableConfig}
              onConfigChange={onTableConfigChange}
            />
            
            <TableExportAccordion 
              styling={tableConfig} 
              onConfigChange={onTableConfigChange} 
            />

            <TableColumnColorsAccordion
              columns={columns}
              onColumnUpdate={handleColumnUpdate}
            />

            <TableStyleClipboardAccordion
              currentWidgetType="table"
              currentWidgetId={selectedWidget.i}
            />

            {onLayoutChange && (
              <PositionAccordion
                selectedWidget={selectedWidget}
                onLayoutChange={onLayoutChange}
              />
            )}

          </Accordion>
        </div>
    </div>
  )
}