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
import TableBehaviorAccordion from './TableBehaviorAccordion'
import TableExportAccordion from './TableExportAccordion'

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

            <TableBehaviorAccordion
              styling={tableConfig}
              onConfigChange={onTableConfigChange}
            />
            
            <TableExportAccordion 
              styling={tableConfig} 
              onConfigChange={onTableConfigChange} 
            />

          </Accordion>
        </div>
    </div>
  )
}