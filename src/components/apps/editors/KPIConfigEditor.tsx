'use client'

import type { DroppedWidget } from '@/types/apps/droppedWidget'
import { isKPIWidget } from '@/types/apps/kpiWidgets'
import type { KPIConfig } from '@/types/apps/kpiWidgets'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import KPICardAccordion from './KPICardAccordion'
import KPITitleAccordion from './KPITitleAccordion'
import KPISubtitleAccordion from './KPISubtitleAccordion'

interface KPIConfigEditorProps {
  selectedWidget: DroppedWidget
  kpiConfig: KPIConfig
  onKPIConfigChange: (field: string, value: unknown) => void
}

export default function KPIConfigEditor({ 
  selectedWidget, 
  kpiConfig, 
  onKPIConfigChange 
}: KPIConfigEditorProps) {
  
  if (!selectedWidget || !isKPIWidget(selectedWidget)) {
    return null
  }

  return (
    <div className="border-t pt-4 mt-4">
      <h4 className="text-sm font-medium text-gray-700 mb-4">📊 KPI Configuration</h4>
      
      {/* Basic Configuration - Always Visible */}
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">KPI Name</label>
          <input
            type="text"
            value={kpiConfig.name || ''}
            onChange={(e) => {
              console.log('🎨 KPIConfigEditor: KPI name changed to:', e.target.value)
              onKPIConfigChange('name', e.target.value)
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Sales Revenue"
          />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Current Value</label>
            <input
              type="number"
              step="any"
              value={kpiConfig.value || ''}
              onChange={(e) => {
                console.log('🎨 KPIConfigEditor: Value changed to:', e.target.value)
                onKPIConfigChange('value', parseFloat(e.target.value) || 0)
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="1247"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Unit</label>
            <input
              type="text"
              value={kpiConfig.unit || ''}
              onChange={(e) => {
                console.log('🎨 KPIConfigEditor: Unit changed to:', e.target.value)
                onKPIConfigChange('unit', e.target.value)
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="$, %, units"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Color Scheme</label>
            <select
              value={kpiConfig.colorScheme || 'blue'}
              onChange={(e) => onKPIConfigChange('colorScheme', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="green">🟢 Green</option>
              <option value="blue">🔵 Blue</option>
              <option value="orange">🟠 Orange</option>
              <option value="red">🔴 Red</option>
            </select>
          </div>
        </div>
      </div>

      {/* Advanced Options - Accordions */}
      <div className="mt-6">
        <h6 className="text-sm font-medium text-gray-700 mb-3">⚙️ Advanced Options</h6>
        <Accordion type="multiple" className="w-full space-y-2">
          
          <KPICardAccordion 
            styling={kpiConfig} 
            onConfigChange={onKPIConfigChange} 
          />
          
          <KPITitleAccordion 
            styling={kpiConfig} 
            onConfigChange={onKPIConfigChange} 
          />

          <KPISubtitleAccordion
            styling={kpiConfig}
            onConfigChange={onKPIConfigChange}
          />

        </Accordion>
      </div>
    </div>
  )
}